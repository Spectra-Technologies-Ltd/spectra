-- CreateIndex
CREATE INDEX "Incident_siteId_reportedAt_idx" ON "Incident"("siteId", "reportedAt");

-- CreateIndex
CREATE INDEX "Incident_siteId_incidentType_idx" ON "Incident"("siteId", "incidentType");

-- CreateIndex
CREATE INDEX "Incident_status_idx" ON "Incident"("status");
