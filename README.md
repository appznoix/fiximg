# FixImg - Image Processor

Processa imagens no diretório atual com redimensionamento, remoção de fundo e conversão de formato.

## Instalação

```bash
npm install
```

## Uso

```bash
node index.js [opções]
```

### Opções

| Opção | Descrição | Padrão |
|-------|-----------|--------|
| `-p <prefixo>` | Prefixo para renomear as imagens | (mantém original) |
| `-w <largura>` | Largura máxima em pixels | 1080 |
| `-t` | Ativa remoção de fundo | false |
| `-e <extensão>` | Formato de saída: webp, png, jpg, avif | webp |
| `-h` | Mostra a ajuda | - |

### Exemplos

```bash
# Remover fundo e converter para PNG
node index.js -t -e png

# Redimensionar para 1200px com prefixo
node index.js -p produto -w 1200

# Conversão simples para WebP
node index.js -e webp

# Modo interativo (sem argumentos)
node index.js
```

## Saída

As imagens processadas são salvas em `./processed/`.

## Requisitos

- Node.js
- sharp
- @imgly/background-removal (para `-t`)
