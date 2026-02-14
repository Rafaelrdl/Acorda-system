# Generated migration for adding 'leve' plan type and PDF limits fields.

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("billing", "0002_payment_plan_nullable"),
    ]

    operations = [
        # 1. Update PlanType choices (add 'leve')
        migrations.AlterField(
            model_name="plan",
            name="plan_type",
            field=models.CharField(
                choices=[
                    ("leve", "Acorda Leve"),
                    ("pro", "Acorda Pro"),
                    ("pro_ia", "Acorda Pro IA"),
                    ("lifetime", "Lifetime (Pro)"),
                ],
                db_index=True,
                max_length=20,
                verbose_name="Tipo",
            ),
        ),
        # 2. Add PDF limit fields
        migrations.AddField(
            model_name="plan",
            name="pdf_max_count",
            field=models.IntegerField(
                blank=True,
                help_text="Número máximo de PDFs permitidos",
                null=True,
                verbose_name="Máx. PDFs",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="pdf_max_total_mb",
            field=models.IntegerField(
                blank=True,
                help_text="Armazenamento total máximo em MB",
                null=True,
                verbose_name="Máx. armazenamento (MB)",
            ),
        ),
        migrations.AddField(
            model_name="plan",
            name="pdf_max_file_mb",
            field=models.IntegerField(
                blank=True,
                help_text="Tamanho máximo por arquivo em MB",
                null=True,
                verbose_name="Máx. tamanho por arquivo (MB)",
            ),
        ),
    ]
