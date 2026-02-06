"""
Add workout training fields, fix PDFFile PK for multi-user safety,
and add WorkoutPlanDayStatus model.
"""
import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models
import uuid

from apps.core.models import pdf_upload_path


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

        # ── PDFFile: drop + recreate with auto PK and unique_together ─
        migrations.DeleteModel(name='PDFFile'),
        migrations.CreateModel(
            name='PDFFile',
            fields=[
                (
                    'id',
                    models.BigAutoField(
                        auto_created=True,
                        primary_key=True,
                        serialize=False,
                        verbose_name='ID',
                    ),
                ),
                ('document_id', models.UUIDField(db_index=True, verbose_name='Documento')),
                ('file', models.FileField(upload_to=pdf_upload_path, verbose_name='Arquivo')),
                ('file_name', models.CharField(max_length=300, verbose_name='Nome do arquivo')),
                ('file_size', models.BigIntegerField(verbose_name='Tamanho do arquivo')),
                ('content_type', models.CharField(blank=True, max_length=100, verbose_name='Content-Type')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='Criado em')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='Atualizado em')),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='pdf_files',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Usuario',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Arquivo PDF',
                'verbose_name_plural': 'Arquivos PDF',
                'ordering': ['-created_at'],
                'unique_together': {('user', 'document_id')},
            },
        ),

        # ── WorkoutPlanDayStatus: new model ──────────────────────────
        migrations.CreateModel(
            name='WorkoutPlanDayStatus',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ('created_at', models.BigIntegerField(verbose_name='Criado em (timestamp)')),
                ('updated_at', models.BigIntegerField(verbose_name='Atualizado em (timestamp)')),
                ('deleted_at', models.BigIntegerField(blank=True, null=True, verbose_name='Deletado em (timestamp)')),
                ('sync_version', models.BigIntegerField(db_index=True, default=0, verbose_name='Versão de sync')),
                ('plan_id', models.UUIDField(db_index=True, verbose_name='Plano')),
                ('date', models.CharField(db_index=True, max_length=10, verbose_name='Data')),
                ('resolution', models.CharField(max_length=10, verbose_name='Resolução')),
                ('moved_to_date', models.CharField(blank=True, max_length=10, verbose_name='Movido para')),
                (
                    'user',
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name='workoutplandaystatuss',
                        to=settings.AUTH_USER_MODEL,
                        verbose_name='Usuário',
                    ),
                ),
            ],
            options={
                'verbose_name': 'Status Dia Treino',
                'verbose_name_plural': 'Status Dias Treino',
                'ordering': ['-date'],
                'abstract': False,
            },
        ),
    ]
