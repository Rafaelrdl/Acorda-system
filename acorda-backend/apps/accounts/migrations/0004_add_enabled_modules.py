# Generated migration for adding enabled_modules field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0003_change_avatar_to_textfield'),
    ]

    operations = [
        migrations.AddField(
            model_name='user',
            name='enabled_modules',
            field=models.JSONField(
                default=dict,
                help_text='Dicionário com módulos habilitados: {financas: true, leitura: true, ...}',
                verbose_name='Módulos ativos'
            ),
        ),
    ]
