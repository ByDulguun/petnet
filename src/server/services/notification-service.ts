import type { NotificationType } from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function createNotification(
  userId: string,
  data: { type: NotificationType; title: string; body?: string; href?: string },
) {
  return prisma.notification.create({ data: { userId, ...data } });
}

export async function getNotificationsForUser(userId: string) {
  return prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUnreadCount(userId: string): Promise<number> {
  return prisma.notification.count({ where: { userId, readAt: null } });
}

export async function markAsRead(id: string, userId: string): Promise<boolean> {
  const existing = await prisma.notification.findUnique({
    where: { id },
    select: { userId: true },
  });
  if (!existing || existing.userId !== userId) return false;
  await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
  return true;
}

export async function markAllAsRead(userId: string): Promise<void> {
  await prisma.notification.updateMany({
    where: { userId, readAt: null },
    data: { readAt: new Date() },
  });
}
