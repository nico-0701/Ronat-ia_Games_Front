import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Card } from '@/ui/Card';
import { PageHeader } from '@/ui/Page';

function LegalFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="legal">
      <PageHeader title={title} back="/" />
      <Card>
        <div className="prose">{children}</div>
      </Card>
      <p className="muted" style={{ textAlign: 'center', fontSize: '0.9rem' }}>
        Versão 2026-10 · <Link to="/privacidade">Privacidade</Link> · <Link to="/termos">Termos de uso</Link>
      </p>
    </div>
  );
}

export function PrivacyPage() {
  return (
    <LegalFrame title="Aviso de privacidade">
      <p>Aqui está, em palavras simples, o que o Ronat-ia Games faz com os seus dados.</p>
      <h2>O que guardamos</h2>
      <ul>
        <li>
          Seu <strong>telefone</strong>, seu <strong>nome</strong> e seu <strong>avatar</strong> (um desenho
          pronto ou uma foto que você enviar).
        </li>
        <li>
          Seu telefone não fica guardado: guardamos só uma impressão irreversível dele (para reconhecer você
          quando voltar) e os 4 últimos dígitos. Não mandamos SMS nem ligamos.
        </li>
        <li>
          Os grupos de que você participa, as partidas que jogou e os seus resultados, para mostrar o placar e
          o ranking.
        </li>
        <li>Os aparelhos em que você entrou (nome do aparelho e datas), para você poder sair deles.</li>
      </ul>
      <h2>Quem vê</h2>
      <ul>
        <li>
          Seu nome e seu avatar aparecem para quem joga com você nos grupos de que participa. Seu telefone não
          aparece para ninguém.
        </li>
        <li>Não vendemos nem repassamos seus dados, não mostramos anúncios e não rastreamos você.</li>
        <li>
          Usamos serviços de hospedagem (Render, Supabase e Cloudflare) para o app funcionar. Eles ficam nos
          Estados Unidos.
        </li>
      </ul>
      <h2>Seus direitos</h2>
      <ul>
        <li>
          No seu <Link to="/perfil">perfil</Link> você pode <strong>baixar seus dados</strong>,{' '}
          <strong>corrigir</strong> seu nome e avatar e <strong>excluir sua conta</strong>. Ao excluir, seu
          nome some, sua foto é apagada e o número fica livre; seus resultados passam a aparecer como
          &quot;Jogador removido&quot;.
        </li>
        <li>Para qualquer outro pedido, fale com quem administra o app.</li>
      </ul>
      <h2>Crianças</h2>
      <p>
        Crianças participam por um perfil (só nome e avatar) criado e acompanhado por um adulto responsável do
        grupo.
      </p>
    </LegalFrame>
  );
}

export function TermsPage() {
  return (
    <LegalFrame title="Termos de uso">
      <p>
        O Ronat-ia Games é um app de jogos para jogar com a família e os amigos. Ao criar uma conta você
        concorda com o seguinte.
      </p>
      <h2>Sua conta</h2>
      <ul>
        <li>Use o seu próprio número de celular.</li>
        <li>
          <strong>Não há senha:</strong> o número é a sua chave. Quem souber o seu número consegue entrar na
          sua conta, então jogue com gente de confiança.
        </li>
        <li>Você pode sair de todos os aparelhos e excluir a conta quando quiser, no seu perfil.</li>
      </ul>
      <h2>Convivência</h2>
      <ul>
        <li>
          Escolha nomes e fotos que respeitem os outros. Donos e administradores do grupo podem remover quem
          não respeitar.
        </li>
        <li>
          Envie só fotos suas ou com autorização de quem aparece. Fotos de crianças só com autorização dos
          responsáveis.
        </li>
        <li>
          Quem cria um perfil para outra pessoa (por exemplo, um familiar) declara ter a autorização dela ou
          do responsável.
        </li>
      </ul>
      <h2>O serviço</h2>
      <ul>
        <li>É gratuito e oferecido como está: pode ficar fora do ar ou mudar.</li>
        <li>
          Os placares e rankings são para diversão; os jogos presenciais, como a mímica, dependem da
          honestidade de quem dá o veredito.
        </li>
      </ul>
      <h2>Mudanças</h2>
      <p>Se estes termos mudarem, você será avisado e poderá aceitar de novo ou excluir a conta.</p>
    </LegalFrame>
  );
}
