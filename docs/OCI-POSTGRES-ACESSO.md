# Como liberar acesso ao PostgreSQL no Oracle Cloud (OCI)

## Seu banco (Connection details)

| Campo                     | Valor                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------ |
| **Primary endpoint (IP)** | `10.0.1.59` (IP **privado** – não acessível pela internet)                           |
| **Primary endpoint FQDN** | `primary.uul7t7yatxqfpzmbfeydnnrxnof3qq.postgresql.us-ashburn-1.oci.oraclecloud.com` |
| **Porta**                 | 5432                                                                                 |
| **CA certificate**        | Salvo em `docs/oci-postgres-ca.pem` neste projeto                                    |

Como o endpoint é um **IP privado (10.0.1.59)**, não dá para conectar direto da sua máquina. É obrigatório usar **Bastion** (túnel) – veja a seção "Opção C: Bastion" abaixo.

---

No OCI, o **Database with PostgreSQL** **não tem** uma tela tipo “Access control” ou “Allowed IPs” como em outros produtos. O acesso é controlado pela **rede** (VCN, Security List e/ou Network Security Groups).

---

## 1. Onde o “IP” é configurado

### Opção A: Security List da subnet do banco

1. No menu do OCI: **Networking** → **Virtual Cloud Networks**.
2. Clique na **VCN** onde o PostgreSQL foi criado (a mesma do DB System).
3. No menu lateral: **Security Lists**.
4. Abra a **Security List** da **subnet** onde está o PostgreSQL (geralmente uma subnet **privada**).
5. Clique em **Add Ingress Rules** e crie uma regra:
   - **Source CIDR**: seu IP público (ex.: `203.0.113.50/32`) ou `0.0.0.0/0` (qualquer IP – só para teste).
   - **IP Protocol**: TCP.
   - **Destination port range**: 5432.

**Importante:** Se o banco está em uma **subnet privada**, ele **não tem IP público**. Nesse caso, regras de ingress na Security List sozinhas **não** vão fazer a internet alcançar o banco. Use a **Opção B (Bastion)** abaixo.

---

### Opção B: Network Security Groups (NSG)

1. Menu: **Databases** → **PostgreSQL** → **DB Systems**.
2. Clique no **DB System** do seu banco.
3. Na página de detalhes, procure a seção **Network configuration**.
4. Clique em **Edit** ao lado de **NSGs**.
5. Associe um **Network Security Group** que já permita tráfego na porta 5432 (ou crie um NSG com regra de ingress para a porta 5432 e o IP desejado).
6. Em **Networking** → **Virtual Cloud Networks** → **Network Security Groups**, edite o NSG e adicione uma **Ingress Rule**:
   - **Source**: seu IP (ex.: `203.0.113.50/32`) ou um CIDR.
   - **Protocol**: TCP, **porta 5432**.

O NSG controla quem pode falar com o DB System na rede da VCN. Se o DB estiver em subnet privada, ainda assim você precisa de **Bastion** ou VPN para chegar até a VCN a partir da internet.

---

### Opção C: Bastion (recomendado para acesso da sua máquina)

A documentação da Oracle diz que os endpoints do PostgreSQL **não são acessíveis diretamente pela internet**. Para conectar do seu PC:

1. **Criar um Bastion** (se ainda não existir):
   - **Networking** → **Customer Connectivity** → **Bastion** (ou **Security** → **Bastion**).
   - Crie um Bastion na **mesma VCN** do PostgreSQL, em uma **subnet pública**.

2. **Criar sessão de Port Forwarding**:
   - Abra o Bastion → **Sessions** → **Create session** → **Port forwarding session**.
   - **Target (Private IP)**: `10.0.1.59` (Primary endpoint do seu DB).
   - **Port**: `5432`.

3. **Conectar no seu PC**:
   - Na sessão, a OCI mostra um comando **SSH** para copiar (ex.: `ssh -i <chave> -L 5432:10.0.1.59:5432 ...`).
   - Rode esse comando no terminal e **deixe a janela aberta** (túnel ativo).
   - Depois disso, no seu computador o PostgreSQL fica em `localhost:5432`.

4. **No projeto**, use no `.env` (ou `.env.local`):
   ```env
   DATABASE_URL="postgresql://admin:SUA_SENHA_AQUI@127.0.0.1:5432/cavalheiros?sslmode=require"
   ```
   Se quiser validar o certificado com o CA que a OCI forneceu:
   ```env
   DATABASE_URL="postgresql://admin:SUA_SENHA_AQUI@127.0.0.1:5432/cavalheiros?sslmode=verify-full&sslrootcert=docs/oci-postgres-ca.pem"
   ```
   Com o túnel ativo, rode: `npm run db:prod:setup` (ou `db:prod:deploy` e `db:prod:seed`).

---

## 2. Resumo

| Onde procurar                                                              | O que fazer                                                                                                                              |
| -------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Não existe** “Access control” / “Allowed IPs” no DB System do PostgreSQL | Normal no OCI PostgreSQL.                                                                                                                |
| **Networking** → **VCN** → **Security Lists**                              | Adicionar regra de **ingress** TCP porta **5432** (seu IP ou CIDR). Só funciona para tráfego que já chega na VCN (ex.: via Bastion/VPN). |
| **DB System** → **Network configuration** → **Edit** → **NSGs**            | Associar NSG que permita tráfego na porta 5432.                                                                                          |
| **Bastion** + **Port forwarding**                                          | Forma recomendada para acessar o banco **da internet** até um PostgreSQL em subnet privada.                                              |

Se mesmo após configurar Security List ou NSG você ainda receber **P1001**, o banco provavelmente está em subnet privada: use **Bastion** (Opção C) para túnel e conecte em `127.0.0.1:5432`.
