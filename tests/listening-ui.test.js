import test from "node:test";
import assert from "node:assert/strict";
import { VOCAB, LISTENING_LESSONS } from "../src/english.js";
import { LESSONS } from "../src/lessons.js";
import {
  renderEnglishHome,
  renderListeningLesson,
} from "../src/listening-ui.js";

const vocabulary = new Map(VOCAB.map((word) => [word.id, word]));
const decode = (text) =>
  text.replace(
    /&(?:amp|lt|gt|quot|#39);/g,
    (entity) =>
      ({ "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" })[
        entity
      ],
  );
const normalize = (text) =>
  decode(text)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();

// Check both what a sighted learner sees and what assistive technology reads.
// Data attributes are routing instructions, not labels presented to a learner.
function learnerText(html) {
  const labels = [
    ...html.matchAll(/\b(?:aria-label|title|alt)="([^"]*)"/g),
  ].map((match) => match[1]);
  const text = html
    .replace(/<svg\b[\s\S]*?<\/svg>/g, " ")
    .replace(/<[^>]*>/g, " ");
  return ` ${normalize([text, ...labels].join(" "))} `;
}

function openingButton(html, attribute, value) {
  return [...html.matchAll(/<button\b[^>]*>/g)]
    .map((match) => match[0])
    .find((tag) => tag.includes(`${attribute}="${value}"`));
}

function assertNoNestedButtons(html) {
  let depth = 0;
  for (const [tag] of html.matchAll(/<\/?button\b[^>]*>/g)) {
    depth += tag.startsWith("</") ? -1 : 1;
    assert.ok(
      depth >= 0 && depth <= 1,
      "every answer has one interactive control",
    );
  }
  assert.equal(depth, 0);
}

test("listening challenges do not disclose the English answer visually or in accessible labels", () => {
  for (const lesson of LISTENING_LESSONS) {
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const word = vocabulary.get(step.audioId);
      for (const hasListened of [false, true]) {
        const html = renderListeningLesson({
          lesson,
          stepIndex,
          hasListened,
          selectedId: step.answerId,
        });
        const text = learnerText(html);
        assert.ok(
          !text.includes(` ${normalize(word.en)} `),
          `${step.id}: the sound, rather than spelling, is the clue`,
        );
        assert.ok(
          !text.includes(` ${normalize(word.speech || word.en)} `),
          step.id,
        );
        assert.ok(
          openingButton(html, "data-action", "listening-reveal"),
          "help is always available",
        );
      }
    }
  }
});

test("a reveal or either answer result connects the English sound to its Spanish meaning", () => {
  for (const lesson of LISTENING_LESSONS) {
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const word = vocabulary.get(step.audioId);
      for (const state of [
        { showText: true },
        { feedback: { ok: true } },
        { feedback: { ok: false } },
      ]) {
        const html = renderListeningLesson({ lesson, stepIndex, ...state });
        const text = learnerText(html);
        assert.ok(
          text.includes(` ${normalize(word.en)} `),
          `${step.id}: English word is available after help or feedback`,
        );
        assert.ok(
          text.includes(` ${normalize(word.es)} `),
          `${step.id}: Spanish meaning remains visible`,
        );
        assert.ok(
          text.includes(` ${normalize(word.pronunciationTip)} `),
          `${step.id}: pronunciation can be practiced after revealing`,
        );
        if (state.feedback)
          assert.ok(text.includes(` ${normalize(step.explanation)} `), step.id);
      }
    }
  }
});

test("picture answers keep their recognizable tile drawings inside a single touch target", () => {
  for (const lesson of LISTENING_LESSONS) {
    for (const [stepIndex, step] of lesson.steps.entries()) {
      const html = renderListeningLesson({ lesson, stepIndex });
      assertNoNestedButtons(html);
      const answers = [
        ...html.matchAll(/<button\b([^>]*)>([\s\S]*?)<\/button>/g),
      ];
      for (const choice of step.choices) {
        const answer = answers.find((match) =>
          match[1].includes(`data-listening-answer="${choice.id}"`),
        );
        assert.ok(answer, `${step.id}: all alternatives can be selected`);
        if (choice.tiles?.length) {
          assert.equal(
            (answer[2].match(/<svg\b/g) || []).length,
            choice.tiles.length,
            `${step.id}: no missing tile pictures`,
          );
          assert.ok(
            answer[1].includes('aria-label="Opción'),
            "picture choices have a spoken Spanish description",
          );
        } else {
          assert.ok(
            learnerText(answer[0]).includes(` ${normalize(choice.label)} `),
            step.id,
          );
        }
      }
    }
  }
  assertNoNestedButtons(renderEnglishHome({ category: "all" }));
});

test("an unavailable voice offers visual help and does not trap the learner", () => {
  const lesson = LISTENING_LESSONS[0];
  const selectedId = lesson.steps[0].answerId;
  const initial = renderListeningLesson({
    lesson,
    selectedId,
    speechSupported: false,
  });
  const audioButtons = [
    ...initial.matchAll(/<button\b[^>]*data-speak="[^"]*"[^>]*>/g),
  ];
  assert.ok(audioButtons.length > 0);
  assert.ok(audioButtons.every(([button]) => /\bdisabled\b/.test(button)));
  assert.ok(
    !/\bdisabled\b/.test(
      openingButton(initial, "data-action", "listening-reveal"),
    ),
  );
  const help = renderListeningLesson({
    lesson,
    selectedId,
    speechSupported: false,
    showText: true,
  });
  assert.ok(
    !/\bdisabled\b/.test(openingButton(help, "data-action", "listening-check")),
  );
  assert.ok(
    learnerText(help).includes(
      ` ${normalize(vocabulary.get(lesson.steps[0].audioId).es)} `,
    ),
  );
});

test("checking requires hearing or visual help, while an incorrect answer leaves another attempt available", () => {
  const lesson = LISTENING_LESSONS[0];
  const step = lesson.steps[0];
  const selectedId = step.choices.find(
    (choice) => choice.id !== step.answerId,
  ).id;
  const beforeListening = renderListeningLesson({ lesson, selectedId });
  assert.ok(
    /\bdisabled\b/.test(
      openingButton(beforeListening, "data-action", "listening-check"),
    ),
  );
  const afterListening = renderListeningLesson({
    lesson,
    selectedId,
    hasListened: true,
  });
  assert.ok(
    !/\bdisabled\b/.test(
      openingButton(afterListening, "data-action", "listening-check"),
    ),
  );
  const retry = renderListeningLesson({
    lesson,
    selectedId,
    hasListened: true,
    feedback: { ok: false },
  });
  assert.ok(!openingButton(retry, "data-action", "listening-next"));
  assert.ok(
    !/\bdisabled\b/.test(
      openingButton(retry, "data-action", "listening-check"),
    ),
  );
  for (const choice of step.choices) {
    assert.ok(
      !/\bdisabled\b/.test(
        openingButton(retry, "data-listening-answer", choice.id),
      ),
    );
  }
  const correct = renderListeningLesson({
    lesson,
    selectedId: step.answerId,
    hasListened: true,
    feedback: { ok: true },
  });
  assert.ok(openingButton(correct, "data-action", "listening-next"));
});

test("progress lets the learner resume, repeat a finished unit, and reach the next practice", () => {
  const [first, second] = LISTENING_LESSONS;
  const html = renderEnglishHome({
    profile: {
      listeningCompleted: [first.id],
      listeningSteps: { [second.id]: 2 },
      audioHeard: ["dots", "bams"],
    },
  });
  for (const lesson of LISTENING_LESSONS)
    assert.ok(html.includes(`href="#escuchar/${lesson.id}"`));
  assert.ok(html.includes('aria-valuenow="2"'));
  assert.ok(learnerText(html).includes(" 2 de 32 sonidos explorados "));
  assert.ok(
    html.includes(`href="#leccion/${LESSONS.at(-1).id}"`),
    "the original vocabulary practice remains reachable",
  );
  assert.ok(openingButton(html, "data-action", "english-game"));
  for (const [index, lesson] of LISTENING_LESSONS.entries()) {
    const completed = renderListeningLesson({
      lesson,
      stepIndex: lesson.steps.length,
    });
    const repeat = openingButton(completed, "data-action", "listening-repeat");
    assert.ok(repeat?.includes(`data-lesson="${lesson.id}"`));
    assert.ok(completed.includes('href="#repaso"'));
    const next = LISTENING_LESSONS[index + 1];
    if (next) assert.ok(completed.includes(`href="#escuchar/${next.id}"`));
    else assert.ok(openingButton(completed, "data-action", "english-game"));
  }
});
