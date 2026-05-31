-- CreateTable
CREATE TABLE "PushSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "userType" TEXT NOT NULL,
    "restaurantId" TEXT,
    "tableId" TEXT,
    "endpoint" TEXT NOT NULL,
    "keys" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PushSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PushSubscription_endpoint_key" ON "PushSubscription"("endpoint");

-- CreateIndex
CREATE INDEX "PushSubscription_restaurantId_idx" ON "PushSubscription"("restaurantId");

-- CreateIndex
CREATE INDEX "PushSubscription_tableId_idx" ON "PushSubscription"("tableId");

-- CreateIndex
CREATE INDEX "PushSubscription_userType_idx" ON "PushSubscription"("userType");

-- CreateIndex
CREATE INDEX "PushSubscription_isActive_idx" ON "PushSubscription"("isActive");
