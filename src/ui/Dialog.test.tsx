import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { Dialog } from './Dialog';

function Harness() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen(true)}>Abrir</button>
      <Dialog
        open={open}
        title="Confirmar"
        onClose={() => setOpen(false)}
        actions={
          <>
            <button>Sim</button>
            <button>Não</button>
          </>
        }
      >
        <input aria-label="Campo" />
      </Dialog>
      <button>Atrás da janela</button>
    </>
  );
}

describe('Dialog', () => {
  it('leva o foco para dentro, prende o Tab e devolve o foco ao fechar com Esc', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    const opener = screen.getByRole('button', { name: 'Abrir' });

    await user.click(opener);
    const dialog = await screen.findByRole('dialog', { name: 'Confirmar' });
    expect(dialog).toHaveFocus();

    await user.tab();
    expect(screen.getByLabelText('Campo')).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Sim' })).toHaveFocus();
    await user.tab();
    expect(screen.getByRole('button', { name: 'Não' })).toHaveFocus();
    await user.tab(); // do último volta ao primeiro, sem escapar para "Atrás da janela"
    expect(screen.getByLabelText('Campo')).toHaveFocus();
    await user.tab({ shift: true }); // do primeiro volta ao último
    expect(screen.getByRole('button', { name: 'Não' })).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(opener).toHaveFocus();
  });

  it('fecha ao tocar fora da janela', async () => {
    const user = userEvent.setup();
    render(<Harness />);
    await user.click(screen.getByRole('button', { name: 'Abrir' }));
    const dialog = await screen.findByRole('dialog');

    await user.pointer({ keys: '[MouseLeft]', target: dialog.parentElement! });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
