import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const spec = JSON.parse(
  readFileSync(new URL("../lib/api-docs/openapi.json", import.meta.url), "utf8"),
);
const create = spec.paths["/api/short"].post;
const requests = create.requestBody.content["application/json"].examples;
const responseMedia = create.responses["201"].content["application/json"];
const responses = responseMedia.examples;

test("Scalar can pair every create request with a response using the same example key", () => {
  assert.equal(
    responseMedia.example,
    undefined,
    "A fixed response example would compete with the selectable examples",
  );
  assert.deepEqual(Object.keys(requests).sort(), Object.keys(responses).sort());
  assert.ok(requests.Single);
  assert.ok(requests.Bulk);
});

for (const [name, example] of Object.entries(requests)) {
  test(`${name} response matches its request mode and input links`, () => {
    const request = example.value;
    const response = responses[name].value;
    assert.equal(response.success, true);
    const inputs = request.is_bulky ? request.links : [request.link];
    const outputs = request.is_bulky ? response.data.links : [response.data];
    if (request.is_bulky) {
      assert.equal(response.data.total_count, inputs.length);
      assert.equal(response.message, "Bulk short links created successfully");
      assert.equal(response.data.short_code, undefined);
    } else {
      assert.equal(response.data.links, undefined);
      assert.equal(response.message, "Short link created successfully");
    }
    assert.equal(outputs.length, inputs.length);
    inputs.forEach((input, index) => {
      assert.equal(outputs[index].original_url, input.original_url);
      assert.equal(outputs[index].title, input.title);
      assert.ok(outputs[index].short_code);
    });
  });
}
