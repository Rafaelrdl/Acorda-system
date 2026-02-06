# Generated migration to remove target_value, current_value, and unit from KeyResult

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='keyresult',
            name='target_value',
        ),
        migrations.RemoveField(
            model_name='keyresult',
            name='current_value',
        ),
        migrations.RemoveField(
            model_name='keyresult',
            name='unit',
        ),
    ]
