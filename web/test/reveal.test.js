import test from 'node:test';
import assert from 'node:assert/strict';
import { revealElements } from '../src/reveal.js';

function createRoot(elements) {
  return {
    querySelectorAll() {
      return elements;
    },
  };
}

function createElement() {
  const classes = new Set();
  return {
    classList: {
      add(name) {
        classes.add(name);
      },
      contains(name) {
        return classes.has(name);
      },
    },
  };
}

test('reveals dynamically inserted content when IntersectionObserver is unavailable', () => {
  const first = createElement();
  const second = createElement();

  revealElements(createRoot([first, second]), undefined);

  assert.equal(first.classList.contains('revealed'), true);
  assert.equal(second.classList.contains('revealed'), true);
});

test('observes dynamically inserted content when IntersectionObserver is available', () => {
  const element = createElement();
  const observed = [];
  class FakeIntersectionObserver {
    constructor(callback) {
      this.callback = callback;
    }

    observe(target) {
      observed.push(target);
      this.callback([{ isIntersecting: true, target }]);
    }

    unobserve() {}
  }

  revealElements(createRoot([element]), FakeIntersectionObserver);

  assert.deepEqual(observed, [element]);
  assert.equal(element.classList.contains('revealed'), true);
});
