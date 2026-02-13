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
    a: 'Sim! O Acorda é um PWA (Progressive Web App) otimizado para mobile. Você pode instalar no iPhone ou Android direto pelo navegador, sem precisar de loja de apps.',
  },
  {
    q: 'Qual a diferença entre os planos?',
    a: 'Todos os planos dão acesso completo ao Acorda (tarefas, metas, hábitos, todas as centrais). Os planos com IA incluem sugestões inteligentes de categorização e insights. O plano vitalício é pago uma única vez e garante acesso para sempre.',
  },
  {
    q: 'Posso cancelar a assinatura?',
    a: 'Sim, você pode cancelar a qualquer momento diretamente nas configurações do app. O acesso continua até o fim do período pago.',
  },
  {
    q: 'Meus dados ficam seguros?',
    a: 'Sim. Usamos autenticação via cookies HttpOnly, CSRF protection e comunicação criptografada (HTTPS). Você tem controle total sobre seus dados, incluindo exportação e exclusão da conta (LGPD).',
  },
  {
    q: 'O que é a metodologia GTD?',
    a: 'GTD (Getting Things Done) é um sistema de produtividade criado por David Allen. A ideia central é: capture tudo que está na sua cabeça, organize em categorias claras, e execute com foco. O Acorda implementa esse fluxo de forma digital e intuitiva.',
  },
  {
    q: 'Quais formas de pagamento são aceitas?',
    a: 'O pagamento é processado pelo Mercado Pago, que aceita cartão de crédito, débito, Pix e boleto bancário.',
  },
  {
    q: 'Não recebi o e-mail de ativação. O que fazer?',
    a: 'Verifique a pasta de spam/lixo eletrônico. Se não encontrar, entre em contato conosco pelo e-mail contato@acorda.app que reenviaremos o link.',
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
