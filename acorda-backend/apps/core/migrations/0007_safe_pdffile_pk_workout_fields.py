"""
Non-destructive migration:
 - Add workout training fields (scheduled_weekdays, prescription, technique)
 - Change PDFFile PK from document_id (UUID) to auto-increment BigAutoField
   while PRESERVING all existing rows.
 - Create WorkoutPlanDayStatus model.

The PDFFile PK change uses SeparateDatabaseAndState + RunSQL so that:
  • SQLite (dev): table recreation preserves data
  • PostgreSQL (prod): ALTER TABLE preserves data
No DeleteModel is used — data is never dropped.
"""
import uuid

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


def _sqlite_recreate_pdffile(apps, schema_editor):
    """
    For SQLite we must recreate the table because it doesn't support
    ADD COLUMN … PRIMARY KEY or DROP PRIMARY KEY.
    This copies data to a temp table, recreates with new schema, copies back.
    """
    if schema_editor.connection.vendor != 'sqlite':
        return

    schema_editor.execute("ALTER TABLE core_pdffile RENAME TO core_pdffile_old;")
    schema_editor.execute("""
        CREATE TABLE core_pdffile (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,
            document_id CHAR(32) NOT NULL,
            file       VARCHAR(100) NOT NULL,
            file_name  VARCHAR(300) NOT NULL,
            file_size  BIGINT NOT NULL,
            content_type VARCHAR(100) NOT NULL DEFAULT '',
            created_at DATETIME NOT NULL,
            updated_at DATETIME NOT NULL,
            user_id    CHAR(32) NOT NULL REFERENCES accounts_user(id)
                       DEFERRABLE INITIALLY DEFERRED
        );
    """)
    schema_editor.execute("""
        INSERT INTO core_pdffile
            (document_id, file, file_name, file_size, content_type,
             created_at, updated_at, user_id)
        SELECT document_id, file, file_name, file_size, content_type,
               created_at, updated_at, user_id
        FROM core_pdffile_old;
    """)
    schema_editor.execute("DROP TABLE core_pdffile_old;")
    schema_editor.execute(
        "CREATE INDEX core_pdffile_document_id_idx ON core_pdffile(document_id);"
    )
    schema_editor.execute(
        "CREATE UNIQUE INDEX core_pdffile_user_doc_uniq "
        "ON core_pdffile(user_id, document_id);"
    )


def _postgres_alter_pdffile(apps, schema_editor):
    """
    For PostgreSQL: add serial id column, move PK, keep data intact.
    """
    if schema_editor.connection.vendor != 'postgresql':
        return

    # Drop old PK constraint
    schema_editor.execute(
        "ALTER TABLE core_pdffile DROP CONSTRAINT IF EXISTS core_pdffile_pkey;"
    )
    # Add auto-increment id column
    schema_editor.execute(
        "ALTER TABLE core_pdffile ADD COLUMN id BIGSERIAL NOT NULL;"
    )
    # Set id as new PK
    schema_editor.execute(
        "ALTER TABLE core_pdffile ADD PRIMARY KEY (id);"
    )
    # document_id is no longer PK, add index
    schema_editor.execute(
        "CREATE INDEX IF NOT EXISTS core_pdffile_document_id_idx "
        "ON core_pdffile(document_id);"
    )
    # unique_together(user, document_id)
    schema_editor.execute(
        "CREATE UNIQUE INDEX IF NOT EXISTS core_pdffile_user_doc_uniq "
        "ON core_pdffile(user_id, document_id);"
    )


def _apply_pdffile_pk_change(apps, schema_editor):
    _sqlite_recreate_pdffile(apps, schema_editor)
    _postgres_alter_pdffile(apps, schema_editor)


def _noop(apps, schema_editor):
    pass


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('core', '0006_add_auto_confirm_fields'),
    ]

    operations = [
        # ── WorkoutPlan: add scheduled_weekdays ─────────────────────
        migrations.AddField(
            model_name='workoutplan',
            name='scheduled_weekdays',
            field=models.JSONField(
                blank=True, default=list, verbose_name='Dias agendados'
            ),
        ),

        # ── WorkoutPlanItem: add prescription + technique ────────────
        migrations.AddField(
            model_name='workoutplanitem',
            name='prescription',
            field=models.JSONField(
                blank=True, null=True, verbose_name='Prescrição'
            ),
        ),
        migrations.AddField(
            model_name='workoutplanitem',
            name='technique',
            field=models.JSONField(
                blank=True, null=True, verbose_name='Técnica'
            ),
        ),

        # ── PDFFile: safe PK migration (data preserved) ─────────────
        # Use SeparateDatabaseAndState so Django state matches the new
        # model definition while the actual DB change is done via RunSQL.
        migrations.SeparateDatabaseAndState(
            state_operations=[
                # Tell Django the document_id is no longer the PK
                migrations.AlterField(
                    model_name='pdffile',
                    name='document_id',
                    field=models.UUIDField(
                        db_index=True, verbose_name='Documento'
                    ),
                ),
                # Tell Django the new auto PK exists
                migrations.AddField(
                    model_name='pdffile',
                    name='id',
                    field=models.BigAutoField(
                        primary_key=True,
                        serialize=False,
                    ),
                ),
                # unique_together
                migrations.AlterUniqueTogether(
                    name='pdffile',
                    unique_together={('user', 'document_id')},
                ),
            ],
            database_operations=[
                # Actual DB transformation via RunPython that dispatches
                # per database vendor (SQLite vs PostgreSQL).
                migrations.RunPython(
                    _apply_pdffile_pk_change,
                    _noop,
                ),
            ],
        ),

        # ── WorkoutPlanDayStatus: new model ──────────────────────────
        migrations.CreateModel(
            name='WorkoutPlanDayStatus',
            fields=[
                ('id', models.UUIDField(
                    default=uuid.uuid4, editable=False,
                    primary_key=True, serialize=False,
                )),
                ('created_at', models.BigIntegerField(
                    verbose_name='Criado em (timestamp)'
                )),
                ('updated_at', models.BigIntegerField(
                    verbose_name='Atualizado em (timestamp)'
                )),
                ('deleted_at', models.BigIntegerField(
                    blank=True, null=True,
                    verbose_name='Deletado em (timestamp)'
                )),
                ('sync_version', models.BigIntegerField(
                    db_index=True, default=0,
                    verbose_name='Versão de sync'
                )),
                ('plan_id', models.UUIDField(
                    db_index=True, verbose_name='Plano'
                )),
                ('date', models.CharField(
                    db_index=True, max_length=10, verbose_name='Data'
                )),
                ('resolution', models.CharField(
                    max_length=10, verbose_name='Resolução'
                )),
                ('moved_to_date', models.CharField(
                    blank=True, max_length=10, verbose_name='Movido para'
                )),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='%(class)ss',
                    to=settings.AUTH_USER_MODEL,
                    verbose_name='Usuário',
                )),
            ],
            options={
                'verbose_name': 'Status Dia Treino',
                'verbose_name_plural': 'Status Dias Treino',
                'ordering': ['-date'],
                'abstract': False,
            },
        ),
    ]
