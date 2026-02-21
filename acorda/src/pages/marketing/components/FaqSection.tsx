import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'

const faqs = [
  {
    q: 'Como funciona o acesso após a compra?',
    a: 'Após o pagamento, enviamos um e-mail de ativação para o endereço informado no checkout. Nele, você cria sua senha e já pode acessar o Acorda imediatamente.',
  },
  {
    q: 'Posso usar no celular?',
    a: 'Sim! O Acorda é um PWA (Progressive Web App) otimizado para mobile. Você pode instalar no iPhone ou Android direto pelo navegador, sem precisar de loja de apps. Funciona offline e recebe atualizações automáticas.',
  },
  {
    q: 'O que consigo fazer dentro do Acorda?',
    a: 'Tudo: capturar ideias (Inbox), organizar tarefas com GTD, definir metas OKR, rastrear hábitos com streak, usar Pomodoro para foco, criar time-blocks no calendário, montar fichas de treino com carga progressiva, controlar dieta e refeições, registrar sessões de estudo com revisão espaçada, gerenciar biblioteca de livros e PDFs, controlar finanças pessoais, e fazer check-ins de bem-estar. Tudo isso alimenta um dashboard de evolução com Score Geral.',
  },
  {
    q: 'Qual a diferença entre os planos?',
    a: 'Todos os planos dão acesso completo ao Acorda (tarefas, metas, hábitos, todas as centrais). A principal diferença está nos limites de armazenamento de PDFs: o Leve permite até 20 PDFs (500 MB), enquanto o Pro permite até 120 PDFs (5 GB). O plano Vitalício tem os mesmos limites do Pro e é pago uma única vez.',
  },
  {
    q: 'Posso cancelar a assinatura?',
    a: 'Sim, você pode cancelar a qualquer momento diretamente nas configurações do app. O acesso continua até o fim do período pago.',
  },
  {
    q: 'O Acorda substitui quais apps?',
    a: 'Ele pode substituir: Todoist/TickTick (tarefas), Notion (organização), Habitica/Streaks (hábitos), Forest/Focus To-Do (Pomodoro), Google Calendar (agenda), Strong/Hevy (treino), MyFitnessPal (dieta), Goodreads (leitura), Anki (revisão espaçada), planilha de gastos (finanças) e apps de diário/humor. Tudo integrado num só lugar.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Usamos autenticação via cookies HttpOnly, CSRF protection e comunicação criptografada (HTTPS). Seus dados ficam armazenados localmente no navegador (IndexedDB) com sync criptografado. Você tem controle total, incluindo exportação completa e exclusão da conta (LGPD).',
  },
  {
    q: 'O que é a metodologia GTD?',
    a: 'GTD (Getting Things Done) é um sistema de produtividade criado por David Allen. A ideia central é: capture tudo que está na sua cabeça, organize em categorias claras, e execute com foco. O Acorda implementa esse fluxo de forma digital e intuitiva.',
  },
  {
    q: 'Como funciona a revisão espaçada nos estudos?',
    a: 'Ao registrar uma sessão de estudo, o Acorda agenda automaticamente revisões nos intervalos D+1, D+3, D+7 e D+14 (baseados em ciência da memória). Você recebe lembretes e pode marcar as revisões como concluídas.',
  },
  {
    q: 'O que é o Score Geral na página Evolução?',
    a: 'É um score de 0 a 100 que combina dados de todos os módulos que você usa: % de metas atingidas, consistência de hábitos, minutos de foco, treinos feitos, aderência à dieta, tempo de estudo, páginas lidas, controle financeiro e check-ins de bem-estar. Ele reflete, de forma numérica, como está sua evolução geral.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'O pagamento é processado pelo Mercado Pago, que aceita cartão de crédito, débito, Pix e boleto bancário.',
  },
  {
    q: 'Tem garantia?',
    a: 'Sim! Oferecemos garantia incondicional de 7 dias. Se por qualquer motivo você não gostar, devolvemos 100% do valor pago, sem perguntas.',
  },
  {
    q: 'Não recebi o e-mail de ativação. O que fazer?',
    a: 'Verifique a pasta de spam/lixo eletrônico. Se não encontrar, entre em contato conosco pelo e-mail contato@somosacorda.com que reenviaremos o link.',
  },
  {
    q: 'O que acontece se eu atingir o limite de PDFs?',
    a: 'Você pode continuar usando o app normalmente, mas o upload de novos PDFs será bloqueado até que você remova arquivos antigos ou faça upgrade do plano.',
  },
]

export function FaqSection() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`}>
          <AccordionTrigger className="text-left text-sm font-medium">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}
