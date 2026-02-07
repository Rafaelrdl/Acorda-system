"""
Core data models for Acorda app.
These mirror the TypeScript types in the frontend.
"""
import uuid
from django.db import models
from django.conf import settings


class SyncableModel(models.Model):
    """Base model with sync support."""
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='%(class)ss',
        verbose_name='Usuário'
    )
    
    created_at = models.BigIntegerField('Criado em (timestamp)')
    updated_at = models.BigIntegerField('Atualizado em (timestamp)')
    deleted_at = models.BigIntegerField('Deletado em (timestamp)', null=True, blank=True)
    
    # Sync tracking
    sync_version = models.BigIntegerField('Versão de sync', default=0, db_index=True)
    
    class Meta:
        abstract = True
    
    def soft_delete(self):
        import time
        now_ms = int(time.time() * 1000)
        self.deleted_at = now_ms
        self.sync_version = now_ms
        self.save(update_fields=['deleted_at', 'sync_version'])


def pdf_upload_path(instance, filename):
    return f"pdfs/{instance.user_id}/{instance.document_id}/{filename}"


class Task(SyncableModel):
    """Task/todo item."""
    
    class Status(models.TextChoices):
        TODO = 'todo', 'A fazer'
        IN_PROGRESS = 'in_progress', 'Em progresso'
        DONE = 'done', 'Concluído'
    
    class EnergyLevel(models.TextChoices):
        LOW = 'low', 'Baixa'
        MEDIUM = 'medium', 'Média'
        HIGH = 'high', 'Alta'
    
    title = models.CharField('Título', max_length=500)
    description = models.TextField('Descrição', blank=True)
    notes = models.TextField('Notas', blank=True)
    status = models.CharField('Status', max_length=20, choices=Status.choices, default=Status.TODO)
    client_status = models.CharField('Status cliente', max_length=20, blank=True)
    energy_level = models.CharField('Nível de energia', max_length=10, choices=EnergyLevel.choices, default=EnergyLevel.MEDIUM)
    estimated_minutes = models.IntegerField('Minutos estimados', null=True, blank=True)
    tags = models.JSONField('Tags', default=list, blank=True)
    scheduled_date = models.CharField('Data agendada', max_length=10, blank=True)  # YYYY-MM-DD
    is_top_priority = models.BooleanField('Prioridade máxima', default=False)
    is_two_minute_task = models.BooleanField('Tarefa de 2 minutos', default=False)
    project_id = models.UUIDField('Projeto', null=True, blank=True, db_index=True)
    key_result_id = models.UUIDField('Resultado chave', null=True, blank=True, db_index=True)
    completed_at = models.BigIntegerField('Concluído em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Tarefa'
        verbose_name_plural = 'Tarefas'
        ordering = ['-created_at']


class Goal(SyncableModel):
    """OKR Goal."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Ativa'
        COMPLETED = 'completed', 'Concluída'
        ARCHIVED = 'archived', 'Arquivada'
    
    objective = models.CharField('Objetivo', max_length=500)
    description = models.TextField('Descrição', blank=True)
    deadline = models.CharField('Prazo', max_length=10, blank=True)  # YYYY-MM-DD
    status = models.CharField('Status', max_length=20, choices=Status.choices, default=Status.ACTIVE)
    
    class Meta:
        verbose_name = 'Meta'
        verbose_name_plural = 'Metas'
        ordering = ['-created_at']


class KeyResult(SyncableModel):
    """Key Result for a Goal."""
    
    goal_id = models.UUIDField('Meta', db_index=True)
    description = models.CharField('Descrição', max_length=500)
    current_value = models.FloatField('Valor atual', default=0)
    target_value = models.FloatField('Valor alvo', default=1)
    unit = models.CharField('Unidade', max_length=50, blank=True)
    
    class Meta:
        verbose_name = 'Resultado Chave'
        verbose_name_plural = 'Resultados Chave'
        ordering = ['created_at']


class Habit(SyncableModel):
    """Habit tracker."""
    
    class Frequency(models.TextChoices):
        DAILY = 'daily', 'Diário'
        WEEKLY = 'weekly', 'Semanal'
        CUSTOM = 'custom', 'Personalizado'
    
    name = models.CharField('Nome', max_length=200)
    description = models.TextField('Descrição', blank=True)
    frequency = models.CharField('Frequência', max_length=20, choices=Frequency.choices, default=Frequency.DAILY)
    times_per_week = models.IntegerField('Vezes por semana', null=True, blank=True)
    target_days = models.JSONField('Dias alvo', default=list)  # [0,1,2,3,4,5,6] for weekdays
    minimum_version = models.CharField('Versão mínima', max_length=20, blank=True)
    key_result_id = models.UUIDField('Resultado chave', null=True, blank=True, db_index=True)
    is_active = models.BooleanField('Ativo', default=True)
    color = models.CharField('Cor', max_length=20, blank=True)
    icon = models.CharField('Ícone', max_length=50, blank=True)
    
    class Meta:
        verbose_name = 'Hábito'
        verbose_name_plural = 'Hábitos'
        ordering = ['created_at']


class HabitLog(SyncableModel):
    """Log of habit completion."""
    
    habit_id = models.UUIDField('Hábito', db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)  # YYYY-MM-DD
    completed_at = models.BigIntegerField('Concluído em')
    notes = models.TextField('Notas', blank=True)
    
    class Meta:
        verbose_name = 'Log de Hábito'
        verbose_name_plural = 'Logs de Hábitos'
        unique_together = ['user', 'habit_id', 'date']
        ordering = ['-date']


class Project(SyncableModel):
    """Project grouping tasks."""
    
    class Status(models.TextChoices):
        ACTIVE = 'active', 'Ativo'
        ON_HOLD = 'on_hold', 'Em espera'
        COMPLETED = 'completed', 'Concluído'
        ARCHIVED = 'archived', 'Arquivado'
    
    name = models.CharField('Nome', max_length=200)
    description = models.TextField('Descrição', blank=True)
    status = models.CharField('Status', max_length=20, choices=Status.choices, default=Status.ACTIVE)
    tags = models.JSONField('Tags', default=list, blank=True)
    color = models.CharField('Cor', max_length=20, blank=True)
    deadline = models.CharField('Prazo', max_length=10, blank=True)
    
    class Meta:
        verbose_name = 'Projeto'
        verbose_name_plural = 'Projetos'
        ordering = ['name']


class InboxItem(SyncableModel):
    """Quick capture inbox item."""
    
    class ItemType(models.TextChoices):
        NOTE = 'note', 'Nota'
        TASK = 'task', 'Tarefa'
        IDEA = 'idea', 'Ideia'
        LINK = 'link', 'Link'
    
    content = models.TextField('Conteúdo')
    notes = models.TextField('Notas', blank=True)
    item_type = models.CharField('Tipo', max_length=20, choices=ItemType.choices, default=ItemType.NOTE)
    is_processed = models.BooleanField('Processado', default=False)
    processed_at = models.BigIntegerField('Processado em', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Item da Inbox'
        verbose_name_plural = 'Itens da Inbox'
        ordering = ['-created_at']


class PomodoroSession(SyncableModel):
    """Pomodoro focus session."""
    
    class SessionType(models.TextChoices):
        WORK = 'work', 'Trabalho'
        BREAK = 'break', 'Pausa'
        LONG_BREAK = 'long_break', 'Pausa longa'
    
    session_type = models.CharField('Tipo', max_length=20, choices=SessionType.choices, default=SessionType.WORK)
    duration_minutes = models.IntegerField('Duração (minutos)', null=True, blank=True)
    started_at = models.BigIntegerField('Iniciado em')
    ended_at = models.BigIntegerField('Finalizado em', null=True, blank=True)
    date = models.CharField('Data', max_length=10, blank=True)  # YYYY-MM-DD
    preset_id = models.UUIDField('Preset', null=True, blank=True, db_index=True)
    planned_minutes = models.IntegerField('Planejado (minutos)', null=True, blank=True)
    actual_minutes = models.IntegerField('Realizado (minutos)', null=True, blank=True)
    completed = models.BooleanField('Concluído', default=False)
    aborted = models.BooleanField('Abortado', default=False)
    interruptions_count = models.IntegerField('Interrupções', default=0)
    task_id = models.UUIDField('Tarefa', null=True, blank=True, db_index=True)
    notes = models.TextField('Notas', blank=True)
    
    class Meta:
        verbose_name = 'Sessão Pomodoro'
        verbose_name_plural = 'Sessões Pomodoro'
        ordering = ['-started_at']


class CalendarBlock(SyncableModel):
    """Time block on calendar."""
    
    title = models.CharField('Título', max_length=200)
    description = models.TextField('Descrição', blank=True)
    date = models.CharField('Data', max_length=10, db_index=True)  # YYYY-MM-DD
    start_time = models.IntegerField('Início (minutos desde meia-noite)')
    end_time = models.IntegerField('Fim (minutos desde meia-noite)')
    type = models.CharField('Tipo', max_length=20, blank=True)
    color = models.CharField('Cor', max_length=20, blank=True)
    task_id = models.UUIDField('Tarefa', null=True, blank=True)
    habit_id = models.UUIDField('Hábito', null=True, blank=True)
    is_recurring = models.BooleanField('Recorrente', default=False)
    recurrence_pattern = models.JSONField('Padrão de recorrência', null=True, blank=True)
    
    class Meta:
        verbose_name = 'Bloco de Calendário'
        verbose_name_plural = 'Blocos de Calendário'
        ordering = ['date', 'start_time']

class DailyNote(SyncableModel):
    """Daily note."""

    date = models.CharField('Data', max_length=10, db_index=True)
    content = models.TextField('Conteudo', blank=True)

    class Meta:
        verbose_name = 'Nota Diaria'
        verbose_name_plural = 'Notas Diarias'
        ordering = ['-date']



class UserSettings(SyncableModel):
    """User preferences and settings."""
    
    settings_data = models.JSONField('Configurações', default=dict)
    
    class Meta:
        verbose_name = 'Configuração do Usuário'
        verbose_name_plural = 'Configurações dos Usuários'
    
    def get_setting(self, key, default=None):
        return self.settings_data.get(key, default)
    
    def set_setting(self, key, value):
        self.settings_data[key] = value
        self.save(update_fields=['settings_data', 'updated_at', 'sync_version'])


class PomodoroPreset(SyncableModel):
    """Pomodoro preset configuration."""

    name = models.CharField('Nome', max_length=200)
    focus_duration = models.IntegerField('Foco (min)')
    break_duration = models.IntegerField('Pausa (min)')
    long_break_duration = models.IntegerField('Pausa longa (min)', default=15)
    sessions_before_long_break = models.IntegerField('Sessões antes da pausa longa', default=4)
    is_default = models.BooleanField('Padrão', default=False)

    class Meta:
        verbose_name = 'Preset Pomodoro'
        verbose_name_plural = 'Presets Pomodoro'
        ordering = ['-created_at']


class Reference(SyncableModel):
    """Reference/knowledge base item."""

    title = models.CharField('Título', max_length=300)
    content = models.TextField('Conteúdo')
    tags = models.JSONField('Tags', default=list, blank=True)
    source_url = models.TextField('URL fonte', blank=True)

    class Meta:
        verbose_name = 'Referência'
        verbose_name_plural = 'Referências'
        ordering = ['-created_at']


class GoogleCalendarConnection(SyncableModel):
    """Google Calendar connection state."""

    connected = models.BooleanField('Conectado', default=False)
    connected_at = models.BigIntegerField('Conectado em', null=True, blank=True)
    disconnected_at = models.BigIntegerField('Desconectado em', null=True, blank=True)
    last_sync_at = models.BigIntegerField('Última sincronização', null=True, blank=True)
    access_token = models.TextField('Access token', blank=True)
    refresh_token = models.TextField('Refresh token', blank=True)
    expires_at = models.BigIntegerField('Expira em', null=True, blank=True)

    class Meta:
        verbose_name = 'Conexão Google Calendar'
        verbose_name_plural = 'Conexões Google Calendar'


class GoogleCalendarEvent(SyncableModel):
    """Google Calendar event mirror."""

    google_event_id = models.CharField('ID Google', max_length=200, db_index=True)
    title = models.CharField('Título', max_length=300)
    description = models.TextField('Descrição', blank=True)
    start_time = models.IntegerField('Início (minutos desde meia-noite)')
    end_time = models.IntegerField('Fim (minutos desde meia-noite)')
    date = models.CharField('Data', max_length=10, db_index=True)
    is_read_only = models.BooleanField('Somente leitura', default=True)
    last_synced_at = models.BigIntegerField('Sincronizado em')

    class Meta:
        verbose_name = 'Evento Google Calendar'
        verbose_name_plural = 'Eventos Google Calendar'
        ordering = ['date', 'start_time']


class FinanceCategory(SyncableModel):
    """Finance category."""

    name = models.CharField('Nome', max_length=200)
    type = models.CharField('Tipo', max_length=20)
    color = models.CharField('Cor', max_length=20, blank=True)
    icon = models.CharField('Ícone', max_length=50, blank=True)

    class Meta:
        verbose_name = 'Categoria Financeira'
        verbose_name_plural = 'Categorias Financeiras'
        ordering = ['name']


class FinanceAccount(SyncableModel):
    """Finance account."""

    name = models.CharField('Nome', max_length=200)
    type = models.CharField('Tipo', max_length=20)
    balance = models.DecimalField('Saldo', max_digits=12, decimal_places=2, default=0)
    color = models.CharField('Cor', max_length=20, blank=True)
    icon = models.CharField('Ícone', max_length=50, blank=True)

    class Meta:
        verbose_name = 'Conta Financeira'
        verbose_name_plural = 'Contas Financeiras'
        ordering = ['name']


class Transaction(SyncableModel):
    """Finance transaction."""

    type = models.CharField('Tipo', max_length=20)
    amount = models.DecimalField('Valor', max_digits=12, decimal_places=2)
    date = models.CharField('Data', max_length=10, db_index=True)
    category_id = models.UUIDField('Categoria', null=True, blank=True, db_index=True)
    account_id = models.UUIDField('Conta', db_index=True)
    description = models.TextField('Descrição')
    notes = models.TextField('Notas', blank=True)
    is_recurring = models.BooleanField('Recorrente', default=False)
    parent_transaction_id = models.UUIDField('Transação pai', null=True, blank=True, db_index=True)
    ai_suggested = models.BooleanField('Sugestão IA', default=False)
    ai_metadata = models.JSONField('Metadata IA', default=dict, blank=True)

    class Meta:
        verbose_name = 'Transação'
        verbose_name_plural = 'Transações'
        ordering = ['-date']


class Income(SyncableModel):
    """Income settings."""

    name = models.CharField('Nome', max_length=200)
    amount = models.DecimalField('Valor', max_digits=12, decimal_places=2)
    type = models.CharField('Tipo', max_length=20)
    category_id = models.UUIDField('Categoria', null=True, blank=True, db_index=True)
    account_id = models.UUIDField('Conta', db_index=True)
    frequency = models.CharField('Frequência', max_length=20, blank=True)
    day_of_month = models.IntegerField('Dia do mês', null=True, blank=True)
    is_active = models.BooleanField('Ativo', default=True)
    auto_confirm = models.BooleanField('Confirmação automática', default=False)
    last_confirmed_month = models.CharField('Último mês confirmado', max_length=7, blank=True, null=True)

    class Meta:
        verbose_name = 'Renda'
        verbose_name_plural = 'Rendas'
        ordering = ['name']


class FixedExpense(SyncableModel):
    """Fixed expense settings."""

    name = models.CharField('Nome', max_length=200)
    amount = models.DecimalField('Valor', max_digits=12, decimal_places=2)
    category_id = models.UUIDField('Categoria', db_index=True)
    account_id = models.UUIDField('Conta', db_index=True)
    frequency = models.CharField('Frequência', max_length=20)
    day_of_month = models.IntegerField('Dia do mês', null=True, blank=True)
    is_active = models.BooleanField('Ativo', default=True)
    auto_confirm = models.BooleanField('Confirmação automática', default=False)
    last_confirmed_month = models.CharField('Último mês confirmado', max_length=7, blank=True, null=True)

    class Meta:
        verbose_name = 'Despesa Fixa'
        verbose_name_plural = 'Despesas Fixas'
        ordering = ['name']


class FinanceAuditLog(SyncableModel):
    """Finance audit log."""

    action = models.CharField('Ação', max_length=100)
    entity_type = models.CharField('Tipo de entidade', max_length=20)
    entity_id = models.CharField('ID da entidade', max_length=100)
    metadata = models.JSONField('Metadata', default=dict, blank=True)

    class Meta:
        verbose_name = 'Log Financeiro'
        verbose_name_plural = 'Logs Financeiros'
        ordering = ['-created_at']


class Book(SyncableModel):
    """Reading book."""

    title = models.CharField('Título', max_length=300)
    author = models.CharField('Autor', max_length=200)
    total_pages = models.IntegerField('Total de páginas')
    current_page = models.IntegerField('Página atual')
    start_date = models.CharField('Data de início', max_length=10)
    target_end_date = models.CharField('Data alvo', max_length=10)
    status = models.CharField('Status', max_length=20)
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Livro'
        verbose_name_plural = 'Livros'
        ordering = ['-created_at']


class ReadingLog(SyncableModel):
    """Reading progress log."""

    book_id = models.UUIDField('Livro', db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)
    pages_read = models.IntegerField('Páginas lidas')
    start_page = models.IntegerField('Página inicial')
    end_page = models.IntegerField('Página final')
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Log de Leitura'
        verbose_name_plural = 'Logs de Leitura'
        ordering = ['-date']


class PDFDocument(SyncableModel):
    """PDF document metadata."""

    file_name = models.CharField('Nome do arquivo', max_length=300)
    file_size = models.IntegerField('Tamanho do arquivo')
    total_pages = models.IntegerField('Total de páginas')
    current_page = models.IntegerField('Página atual')
    last_opened_at = models.BigIntegerField('Última abertura', null=True, blank=True)

    class Meta:
        verbose_name = 'Documento PDF'
        verbose_name_plural = 'Documentos PDF'
        ordering = ['-created_at']


class PDFHighlight(SyncableModel):
    """PDF highlight."""

    document_id = models.UUIDField('Documento', db_index=True)
    page_number = models.IntegerField('Página')
    text = models.TextField('Texto')
    color = models.CharField('Cor', max_length=20)
    note = models.TextField('Nota', blank=True)
    position = models.JSONField('Posição')

    class Meta:
        verbose_name = 'Highlight PDF'
        verbose_name_plural = 'Highlights PDF'
        ordering = ['-created_at']

class PDFFile(models.Model):
    """PDF file storage."""

    id = models.BigAutoField(primary_key=True)
    document_id = models.UUIDField('Documento', db_index=True)
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='pdf_files',
        verbose_name='Usuario'
    )
    file = models.FileField('Arquivo', upload_to=pdf_upload_path)
    file_name = models.CharField('Nome do arquivo', max_length=300)
    file_size = models.BigIntegerField('Tamanho do arquivo')
    content_type = models.CharField('Content-Type', max_length=100, blank=True)
    created_at = models.DateTimeField('Criado em', auto_now_add=True)
    updated_at = models.DateTimeField('Atualizado em', auto_now=True)

    class Meta:
        verbose_name = 'Arquivo PDF'
        verbose_name_plural = 'Arquivos PDF'
        unique_together = [['user', 'document_id']]
        ordering = ['-created_at']



class Subject(SyncableModel):
    """Study subject."""

    name = models.CharField('Nome', max_length=200)
    color = models.CharField('Cor', max_length=20, blank=True)
    icon = models.CharField('Ícone', max_length=50, blank=True)

    class Meta:
        verbose_name = 'Matéria'
        verbose_name_plural = 'Matérias'
        ordering = ['name']


class StudySession(SyncableModel):
    """Study session."""

    subject_id = models.UUIDField('Matéria', db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)
    start_time = models.IntegerField('Início (minutos desde meia-noite)')
    end_time = models.IntegerField('Fim (minutos desde meia-noite)', null=True, blank=True)
    duration_minutes = models.IntegerField('Duração (minutos)')
    quick_notes = models.TextField('Notas rápidas', blank=True)
    self_test_questions = models.JSONField('Autoavaliação', default=list, blank=True)

    class Meta:
        verbose_name = 'Sessão de Estudo'
        verbose_name_plural = 'Sessões de Estudo'
        ordering = ['-date']


class ConsentLog(SyncableModel):
    """Consent log."""

    consent_type = models.CharField('Tipo de consentimento', max_length=50)
    granted = models.BooleanField('Consentimento concedido')
    timestamp = models.BigIntegerField('Timestamp')
    ip_address = models.CharField('IP', max_length=100, blank=True)

    class Meta:
        verbose_name = 'Consentimento'
        verbose_name_plural = 'Consentimentos'
        ordering = ['-created_at']


class RecordedStudySession(SyncableModel):
    """Recorded study session with AI outputs."""

    subject_id = models.UUIDField('Matéria', db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)
    duration_minutes = models.IntegerField('Duração (minutos)')
    transcription = models.TextField('Transcrição', blank=True)
    ai_summary = models.TextField('Resumo IA', blank=True)
    ai_questions = models.JSONField('Perguntas IA', default=list, blank=True)
    review_schedule = models.JSONField('Revisões', default=list, blank=True)
    consent_log_id = models.UUIDField('Consentimento', db_index=True)

    class Meta:
        verbose_name = 'Sessão Gravada'
        verbose_name_plural = 'Sessões Gravadas'
        ordering = ['-date']


class ReviewScheduleItem(SyncableModel):
    """Review schedule item for a recorded session."""

    recorded_session_id = models.UUIDField('Sessão gravada', db_index=True)
    scheduled_date = models.CharField('Data agendada', max_length=10, db_index=True)
    completed = models.BooleanField('Concluído', default=False)
    completed_at = models.BigIntegerField('Concluído em', null=True, blank=True)
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Revisão'
        verbose_name_plural = 'Revisões'
        ordering = ['scheduled_date']


class WellnessProgram(SyncableModel):
    """Wellness program."""

    type = models.CharField('Tipo', max_length=20)
    duration = models.IntegerField('Duração (dias)')
    start_date = models.CharField('Data de início', max_length=10)
    is_active = models.BooleanField('Ativo', default=True)
    current_day = models.IntegerField('Dia atual', default=1)

    class Meta:
        verbose_name = 'Programa de Bem-estar'
        verbose_name_plural = 'Programas de Bem-estar'
        ordering = ['-created_at']


class WellnessCheckIn(SyncableModel):
    """Wellness daily check-in."""

    date = models.CharField('Data', max_length=10, db_index=True)
    sleep_hours = models.FloatField('Horas de sono', null=True, blank=True)
    energy_level = models.CharField('Energia', max_length=10, blank=True)
    mood = models.CharField('Humor', max_length=10, blank=True)
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Check-in'
        verbose_name_plural = 'Check-ins'
        ordering = ['-date']


class WellnessDayAction(SyncableModel):
    """Daily action for wellness program."""

    program_id = models.UUIDField('Programa', db_index=True)
    day = models.IntegerField('Dia')
    action = models.TextField('Ação')
    completed = models.BooleanField('Concluído', default=False)
    completed_at = models.BigIntegerField('Concluído em', null=True, blank=True)

    class Meta:
        verbose_name = 'Ação de Bem-estar'
        verbose_name_plural = 'Ações de Bem-estar'
        ordering = ['program_id', 'day']


class WorkoutExercise(SyncableModel):
    """Workout exercise."""

    name = models.CharField('Nome', max_length=200)
    muscle_group = models.CharField('Grupo muscular', max_length=30, blank=True)
    equipment = models.CharField('Equipamento', max_length=100, blank=True)

    class Meta:
        verbose_name = 'Exercício'
        verbose_name_plural = 'Exercícios'
        ordering = ['name']


class WorkoutPlan(SyncableModel):
    """Workout plan."""

    name = models.CharField('Nome', max_length=200)
    notes = models.TextField('Notas', blank=True)
    is_archived = models.BooleanField('Arquivado', default=False)
    scheduled_weekdays = models.JSONField('Dias agendados', default=list, blank=True)

    class Meta:
        verbose_name = 'Plano de Treino'
        verbose_name_plural = 'Planos de Treino'
        ordering = ['name']


class WorkoutPlanItem(SyncableModel):
    """Workout plan item."""

    plan_id = models.UUIDField('Plano', db_index=True)
    exercise_id = models.UUIDField('Exercício', db_index=True)
    order = models.IntegerField('Ordem')
    target_sets = models.IntegerField('Séries alvo', null=True, blank=True)
    target_reps_min = models.IntegerField('Reps mín', null=True, blank=True)
    target_reps_max = models.IntegerField('Reps máx', null=True, blank=True)
    prescription = models.JSONField('Prescrição', null=True, blank=True)
    technique = models.JSONField('Técnica', null=True, blank=True)

    class Meta:
        verbose_name = 'Item do Plano'
        verbose_name_plural = 'Itens do Plano'
        ordering = ['plan_id', 'order']


class WorkoutSession(SyncableModel):
    """Workout session."""

    plan_id = models.UUIDField('Plano', null=True, blank=True, db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)
    started_at = models.BigIntegerField('Início')
    ended_at = models.BigIntegerField('Fim', null=True, blank=True)
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Sessão de Treino'
        verbose_name_plural = 'Sessões de Treino'
        ordering = ['-date']


class WorkoutSetLog(SyncableModel):
    """Workout set log."""

    session_id = models.UUIDField('Sessão', db_index=True)
    exercise_id = models.UUIDField('Exercício', db_index=True)
    set_index = models.IntegerField('Série')
    reps = models.IntegerField('Repetições')
    weight = models.FloatField('Peso')
    unit = models.CharField('Unidade', max_length=5)
    is_warmup = models.BooleanField('Aquecimento', default=False)

    class Meta:
        verbose_name = 'Log de Série'
        verbose_name_plural = 'Logs de Série'
        ordering = ['-created_at']


class DietMealTemplate(SyncableModel):
    """Diet meal template."""

    name = models.CharField('Nome', max_length=200)
    default_time_minutes = models.IntegerField('Horário padrão (min)')
    foods = models.JSONField('Alimentos', default=list, blank=True)

    class Meta:
        verbose_name = 'Template de Refeição'
        verbose_name_plural = 'Templates de Refeição'
        ordering = ['name']


class WorkoutPlanDayStatus(SyncableModel):
    """Resolution status for a scheduled workout day."""

    plan_id = models.UUIDField('Plano', db_index=True)
    date = models.CharField('Data', max_length=10, db_index=True)
    resolution = models.CharField('Resolução', max_length=10)  # 'done' | 'moved'
    moved_to_date = models.CharField('Movido para', max_length=10, blank=True)

    class Meta:
        verbose_name = 'Status Dia Treino'
        verbose_name_plural = 'Status Dias Treino'
        ordering = ['-date']


class DietMealEntry(SyncableModel):
    """Diet meal entry."""

    date = models.CharField('Data', max_length=10, db_index=True)
    name = models.CharField('Nome', max_length=200)
    time_minutes = models.IntegerField('Horário (min)')
    foods = models.JSONField('Alimentos', default=list, blank=True)
    is_completed = models.BooleanField('Concluído', default=False)
    completed_at = models.BigIntegerField('Concluído em', null=True, blank=True)
    notes = models.TextField('Notas', blank=True)

    class Meta:
        verbose_name = 'Refeição'
        verbose_name_plural = 'Refeições'
        ordering = ['-date', 'time_minutes']


class DataExport(SyncableModel):
    """Data export record."""

    export_type = models.CharField('Tipo de exportação', max_length=30)
    status = models.CharField('Status', max_length=20)
    data = models.TextField('Dados', blank=True)
    completed_at = models.BigIntegerField('Concluído em', null=True, blank=True)

    class Meta:
        verbose_name = 'Exportação'
        verbose_name_plural = 'Exportações'
        ordering = ['-created_at']
