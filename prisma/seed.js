import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const adminUser = {
  email: process.env.ADMIN_EMAIL ?? "admin@cambis.local",
  name: process.env.ADMIN_NAME ?? "Cambiste Principal",
  password: process.env.ADMIN_PASSWORD ?? "Admin12345!",
};

const clients = [
  {
    fullName: "Ibrahim Musa",
    nickname: "Ibro",
    phone: "+234 803 441 2287",
    note: "Client regulier du marche central.",
  },
  {
    fullName: "Aissatou Diallo",
    nickname: "Aicha",
    phone: "+221 77 510 9821",
    note: "Prefere les operations rapides en fin de matinee.",
  },
  {
    fullName: "Moussa Abdou",
    nickname: "Momo",
    phone: "+227 96 221 004",
    note: "Grossiste textile, volumes frequents.",
  },
  {
    fullName: "Fatima Sanusi",
    nickname: "Fatou",
    phone: "+234 816 908 3342",
    note: "Bon historique, toujours ponctuelle.",
  },
  {
    fullName: "Seydou Traore",
    nickname: "Seydou",
    phone: "+223 74 120 451",
    note: "Client suivi pour les transferts de fin de semaine.",
  },
  {
    fullName: "Ngozi Okafor",
    nickname: "Ngozi",
    phone: "+234 809 170 6620",
    note: "Aime negocier sur les gros montants.",
  },
];

const dayOffset = (days, hours, minutes) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(hours, minutes, 0, 0);
  return date;
};

const transactions = [
  {
    clientFullName: "Ibrahim Musa",
    operationType: "BUY_NAIRA",
    amountCfa: 152500,
    amountNaira: 350000,
    exchangeRate: 2.2951,
    note: "Transaction du matin avant ouverture complete.",
    transactionDate: dayOffset(-5, 8, 40),
  },
  {
    clientFullName: "Aissatou Diallo",
    operationType: "SELL_NAIRA",
    amountCfa: 98000,
    amountNaira: 220000,
    exchangeRate: 2.2449,
    note: "Reglement comptant.",
    transactionDate: dayOffset(-5, 11, 15),
  },
  {
    clientFullName: "Moussa Abdou",
    operationType: "BUY_NAIRA",
    amountCfa: 245000,
    amountNaira: 560000,
    exchangeRate: 2.2857,
    note: "Commande textile hebdomadaire.",
    transactionDate: dayOffset(-4, 9, 5),
  },
  {
    clientFullName: "Fatima Sanusi",
    operationType: "SELL_NAIRA",
    amountCfa: 126000,
    amountNaira: 285000,
    exchangeRate: 2.2619,
    note: "Vente rapide au comptoir.",
    transactionDate: dayOffset(-4, 14, 10),
  },
  {
    clientFullName: "Seydou Traore",
    operationType: "BUY_NAIRA",
    amountCfa: 310000,
    amountNaira: 705000,
    exchangeRate: 2.2742,
    note: "Preparation transfert fin de semaine.",
    transactionDate: dayOffset(-3, 10, 0),
  },
  {
    clientFullName: "Ngozi Okafor",
    operationType: "SELL_NAIRA",
    amountCfa: 87000,
    amountNaira: 195000,
    exchangeRate: 2.2414,
    note: "Petit ajustement de caisse.",
    transactionDate: dayOffset(-3, 16, 25),
  },
  {
    clientFullName: "Ibrahim Musa",
    operationType: "SELL_NAIRA",
    amountCfa: 111000,
    amountNaira: 250000,
    exchangeRate: 2.2523,
    note: "Besoin urgent de liquidite.",
    transactionDate: dayOffset(-2, 9, 20),
  },
  {
    clientFullName: "Moussa Abdou",
    operationType: "BUY_NAIRA",
    amountCfa: 420000,
    amountNaira: 960000,
    exchangeRate: 2.2857,
    note: "Gros volume avant fermeture de marche.",
    transactionDate: dayOffset(-2, 17, 5),
  },
  {
    clientFullName: "Aissatou Diallo",
    operationType: "BUY_NAIRA",
    amountCfa: 165000,
    amountNaira: 375000,
    exchangeRate: 2.2727,
    note: "Acompte boutique accessoires.",
    transactionDate: dayOffset(-1, 10, 30),
  },
  {
    clientFullName: "Fatima Sanusi",
    operationType: "SELL_NAIRA",
    amountCfa: 93000,
    amountNaira: 210000,
    exchangeRate: 2.2581,
    note: "Sortie rapide avant midi.",
    transactionDate: dayOffset(-1, 12, 10),
  },
  {
    clientFullName: "Ngozi Okafor",
    operationType: "BUY_NAIRA",
    amountCfa: 278000,
    amountNaira: 630000,
    exchangeRate: 2.2662,
    note: "Taux negocie sur volume eleve.",
    transactionDate: dayOffset(-1, 15, 45),
  },
  {
    clientFullName: "Seydou Traore",
    operationType: "SELL_NAIRA",
    amountCfa: 134000,
    amountNaira: 300000,
    exchangeRate: 2.2388,
    note: "Operation retour de marche.",
    transactionDate: dayOffset(0, 8, 55),
  },
  {
    clientFullName: "Ibrahim Musa",
    operationType: "BUY_NAIRA",
    amountCfa: 198000,
    amountNaira: 450000,
    exchangeRate: 2.2727,
    note: "Flux debut de journee.",
    transactionDate: dayOffset(0, 10, 5),
  },
  {
    clientFullName: "Fatima Sanusi",
    operationType: "BUY_NAIRA",
    amountCfa: 222500,
    amountNaira: 505000,
    exchangeRate: 2.2697,
    note: "Demande recurrente sur stock naira.",
    transactionDate: dayOffset(0, 13, 20),
  },
];

async function ensureClient(client) {
  const existing = await prisma.client.findFirst({
    where: {
      fullName: client.fullName,
      phone: client.phone,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.client.create({ data: client });
}

async function ensureTransaction(transaction, clientId) {
  const existing = await prisma.transaction.findFirst({
    where: {
      clientId,
      operationType: transaction.operationType,
      amountCfa: transaction.amountCfa,
      amountNaira: transaction.amountNaira,
      exchangeRate: transaction.exchangeRate,
      transactionDate: transaction.transactionDate,
    },
  });

  if (existing) {
    return existing;
  }

  return prisma.transaction.create({
    data: {
      clientId,
      operationType: transaction.operationType,
      amountCfa: transaction.amountCfa,
      amountNaira: transaction.amountNaira,
      exchangeRate: transaction.exchangeRate,
      note: transaction.note,
      transactionDate: transaction.transactionDate,
    },
  });
}

async function main() {
  const passwordHash = await hash(adminUser.password, 10);

  const user = await prisma.user.upsert({
    where: { email: adminUser.email },
    update: {
      name: adminUser.name,
      passwordHash,
    },
    create: {
      email: adminUser.email,
      name: adminUser.name,
      passwordHash,
    },
  });

  const clientMap = new Map();

  for (const client of clients) {
    const savedClient = await ensureClient(client);
    clientMap.set(savedClient.fullName, savedClient);
  }

  for (const transaction of transactions) {
    const client = clientMap.get(transaction.clientFullName);

    if (!client) {
      throw new Error(`Client introuvable pour le seed: ${transaction.clientFullName}`);
    }

    await ensureTransaction(transaction, client.id);
  }

  const [clientCount, transactionCount] = await Promise.all([
    prisma.client.count(),
    prisma.transaction.count(),
  ]);

  console.log("Seed termine.");
  console.log(`Utilisateur: ${user.email}`);
  console.log(`Clients en base: ${clientCount}`);
  console.log(`Transactions en base: ${transactionCount}`);
}

main()
  .catch((error) => {
    console.error("Erreur pendant le seed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });