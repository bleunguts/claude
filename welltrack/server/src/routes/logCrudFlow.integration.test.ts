import { describe, it, expect, vi } from "vitest";

// One in-memory store per model, shared by whichever service queries it — these are
// real integration tests of the actual service/controller/route/middleware stack,
// just swapping the Prisma client for an in-memory fake (no live Postgres in this
// dev environment; same rationale as the rest of this codebase's test suite).
// The store is built via a dynamic import inside the mock factory because vitest
// hoists vi.mock (and vi.hoisted) above regular imports, so a statically-imported
// helper isn't initialized yet at the point this factory would otherwise run.
vi.mock("../lib/prisma.js", async () => {
  const { createModelStore } = await import("../test/fakeModelStore.js");
  return {
    prisma: {
      symptom: createModelStore(),
      symptomLog: createModelStore(),
      moodLog: createModelStore(),
      medication: createModelStore(),
      medicationLog: createModelStore(),
      habit: createModelStore(),
      habitLog: createModelStore(),
    },
  };
});

import request from "supertest";
import { app } from "../app.js";
import { signAccessToken } from "../services/tokenService.js";

const userAToken = `Bearer ${signAccessToken({ sub: "user-a" })}`;
const userBToken = `Bearer ${signAccessToken({ sub: "user-b" })}`;

describe("symptom-log CRUD cycle", () => {
  it("supports create -> list -> update -> delete, and rejects cross-user access", async () => {
    const symptomRes = await request(app)
      .post("/api/symptoms")
      .set("Authorization", userAToken)
      .send({ name: "Headache", category: "pain" });
    expect(symptomRes.status).toBe(201);
    const symptomId = symptomRes.body.id;

    const createRes = await request(app)
      .post("/api/symptom-logs")
      .set("Authorization", userAToken)
      .send({ symptomId, severity: 6 });
    expect(createRes.status).toBe(201);
    const logId = createRes.body.id;

    const listRes = await request(app).get("/api/symptom-logs").set("Authorization", userAToken);
    expect(listRes.status).toBe(200);
    expect(listRes.body.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/symptom-logs/${logId}`)
      .set("Authorization", userAToken)
      .send({ severity: 8 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.severity).toBe(8);

    const crossUserPatchRes = await request(app)
      .patch(`/api/symptom-logs/${logId}`)
      .set("Authorization", userBToken)
      .send({ severity: 1 });
    expect(crossUserPatchRes.status).toBe(404);

    const crossUserDeleteRes = await request(app)
      .delete(`/api/symptom-logs/${logId}`)
      .set("Authorization", userBToken);
    expect(crossUserDeleteRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/symptom-logs/${logId}`)
      .set("Authorization", userAToken);
    expect(deleteRes.status).toBe(204);

    const finalListRes = await request(app)
      .get("/api/symptom-logs")
      .set("Authorization", userAToken);
    expect(finalListRes.body.total).toBe(0);
  });
});

describe("mood-log CRUD cycle", () => {
  it("supports create -> list -> update -> delete, and rejects cross-user access", async () => {
    const createRes = await request(app)
      .post("/api/mood-logs")
      .set("Authorization", userAToken)
      .send({ moodScore: 4, energyLevel: 3 });
    expect(createRes.status).toBe(201);
    const logId = createRes.body.id;

    const listRes = await request(app).get("/api/mood-logs").set("Authorization", userAToken);
    expect(listRes.body.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/mood-logs/${logId}`)
      .set("Authorization", userAToken)
      .send({ moodScore: 5 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.moodScore).toBe(5);

    const crossUserRes = await request(app)
      .delete(`/api/mood-logs/${logId}`)
      .set("Authorization", userBToken);
    expect(crossUserRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/mood-logs/${logId}`)
      .set("Authorization", userAToken);
    expect(deleteRes.status).toBe(204);

    const finalListRes = await request(app).get("/api/mood-logs").set("Authorization", userAToken);
    expect(finalListRes.body.total).toBe(0);
  });
});

describe("medication-log CRUD cycle", () => {
  it("supports create -> list -> update -> delete, and rejects cross-user access", async () => {
    const medicationRes = await request(app)
      .post("/api/medications")
      .set("Authorization", userAToken)
      .send({ name: "Ibuprofen", dosage: "200mg" });
    expect(medicationRes.status).toBe(201);
    const medicationId = medicationRes.body.id;

    const createRes = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", userAToken)
      .send({ medicationId, taken: true });
    expect(createRes.status).toBe(201);
    const logId = createRes.body.id;

    const listRes = await request(app).get("/api/medication-logs").set("Authorization", userAToken);
    expect(listRes.body.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/medication-logs/${logId}`)
      .set("Authorization", userAToken)
      .send({ taken: false });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.taken).toBe(false);

    const crossUserRes = await request(app)
      .patch(`/api/medication-logs/${logId}`)
      .set("Authorization", userBToken)
      .send({ taken: true });
    expect(crossUserRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/medication-logs/${logId}`)
      .set("Authorization", userAToken);
    expect(deleteRes.status).toBe(204);

    const finalListRes = await request(app)
      .get("/api/medication-logs")
      .set("Authorization", userAToken);
    expect(finalListRes.body.total).toBe(0);
  });

  it("returns 404 when creating a log against another user's medication", async () => {
    const medicationRes = await request(app)
      .post("/api/medications")
      .set("Authorization", userAToken)
      .send({ name: "Aspirin" });
    const medicationId = medicationRes.body.id;

    const res = await request(app)
      .post("/api/medication-logs")
      .set("Authorization", userBToken)
      .send({ medicationId, taken: true });

    expect(res.status).toBe(404);
  });
});

describe("habit-log CRUD cycle", () => {
  it("supports create -> list -> update -> delete, and rejects cross-user access", async () => {
    const habitRes = await request(app)
      .post("/api/habits")
      .set("Authorization", userAToken)
      .send({ name: "Meditate", trackingType: "duration", unit: "minutes" });
    expect(habitRes.status).toBe(201);
    const habitId = habitRes.body.id;

    const createRes = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", userAToken)
      .send({ habitId, valueDuration: 15 });
    expect(createRes.status).toBe(201);
    const logId = createRes.body.id;

    const wrongFieldRes = await request(app)
      .post("/api/habit-logs")
      .set("Authorization", userAToken)
      .send({ habitId, valueBoolean: true });
    expect(wrongFieldRes.status).toBe(400);
    expect(wrongFieldRes.body).toMatchObject({ error: { code: "INVALID_HABIT_LOG_VALUE" } });

    const listRes = await request(app).get("/api/habit-logs").set("Authorization", userAToken);
    expect(listRes.body.total).toBe(1);

    const updateRes = await request(app)
      .patch(`/api/habit-logs/${logId}`)
      .set("Authorization", userAToken)
      .send({ valueDuration: 30 });
    expect(updateRes.status).toBe(200);
    expect(updateRes.body.valueDuration).toBe(30);

    const crossUserRes = await request(app)
      .delete(`/api/habit-logs/${logId}`)
      .set("Authorization", userBToken);
    expect(crossUserRes.status).toBe(404);

    const deleteRes = await request(app)
      .delete(`/api/habit-logs/${logId}`)
      .set("Authorization", userAToken);
    expect(deleteRes.status).toBe(204);

    const finalListRes = await request(app).get("/api/habit-logs").set("Authorization", userAToken);
    expect(finalListRes.body.total).toBe(0);
  });
});
