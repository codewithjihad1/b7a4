import { prisma } from "../src/lib/prisma.js";

const orderId = process.argv[2];
if (!orderId) {
    console.error("Usage: tsx scripts/simulate-payment.ts <orderId>");
    process.exit(1);
}

async function main() {
    await prisma.rentalOrder.update({
        where: { id: orderId },
        data: { status: "PAID", paymentStatus: "SUCCESS" },
    });
    console.log(`Order ${orderId} marked as PAID`);
    await prisma.$disconnect();
}

main();
