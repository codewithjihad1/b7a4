import { prisma } from "../src/lib/prisma.js";

async function main() {
    await prisma.user.update({
        where: { email: "admin@example.com" },
        data: { role: "ADMIN" },
    });
    console.log("Admin role set");
    await prisma.$disconnect();
}

main();
