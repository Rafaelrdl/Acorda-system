# Generated migration for adding appearance and week_starts_on fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0004_add_enabled_modules'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='appearance',
            field=models.CharField(
                choices=[('light', 'Claro'), ('dark', 'Escuro')],
                default='light',
                max_length=10,
                verbose_name='Tema'
            ),
        ),
        migrations.AddField(
            model_name='user',
            name='week_starts_on',
            field=models.IntegerField(
                choices=[(0, 'Domingo'), (1, 'Segunda-feira')],
                default=1,
                verbose_name='Início da semana'
            ),
        ),
    ]
