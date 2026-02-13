from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0005_add_user_preferences'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='appearance',
            field=models.CharField(
                'Tema',
                max_length=10,
                choices=[('light', 'Claro'), ('dark', 'Escuro')],
                default='dark',
            ),
        ),
    ]
