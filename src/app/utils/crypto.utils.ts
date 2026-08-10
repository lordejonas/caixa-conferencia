// src/app/utils/crypto.utils.ts

/**
 * Gera um Hash SHA-256 de uma string (ex: senha).
 * Não é possível reverter esse hash para a senha original.
 */
export async function gerarHashSenha(senha: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(senha);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
