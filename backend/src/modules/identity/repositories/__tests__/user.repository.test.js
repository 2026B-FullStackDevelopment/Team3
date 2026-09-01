import assert from "node:assert/strict";
import { afterEach, test } from "node:test";

import { User, userRole, AccountStatus } from "../../models/User.js";
import * as userRepository from "../user.repository.js";

const originalFind = User.find;
const originalCountDocuments = User.countDocuments;
const originalFindByIdAndUpdate = User.findByIdAndUpdate;

afterEach(() => {
  User.find = originalFind;
  User.countDocuments = originalCountDocuments;
  User.findByIdAndUpdate = originalFindByIdAndUpdate;
});

test("findAll filters by role and paginates via skip/limit", async () => {
  const entries = [{ _id: "user-1" }];
  let findQuery;
  let sortArg;
  let skipArg;
  let limitArg;
  let countQuery;

  User.find = (query) => {
    findQuery = query;
    return {
      sort(arg) {
        sortArg = arg;
        return this;
      },
      skip(arg) {
        skipArg = arg;
        return this;
      },
      limit(arg) {
        limitArg = arg;
        return Promise.resolve(entries);
      },
    };
  };
  User.countDocuments = (query) => {
    countQuery = query;
    return Promise.resolve(1);
  };

  const result = await userRepository.findAll({
    roles: [userRole.Recipient, userRole.Donor],
    page: 2,
    limit: 10,
  });

  assert.deepEqual(findQuery, {
    role: { $in: [userRole.Recipient, userRole.Donor] },
  });
  assert.deepEqual(countQuery, findQuery);
  assert.deepEqual(sortArg, { createdAt: -1 });
  assert.equal(skipArg, 10); // (page 2 - 1) * limit 10
  assert.equal(limitArg, 10);
  assert.deepEqual(result, { entries, total: 1 });
});

test("updateAccountStatus is a single atomic findByIdAndUpdate", async () => {
  let receivedArgs;
  const updated = { _id: "user-1", accountStatus: AccountStatus.Deactivated };

  User.findByIdAndUpdate = (...args) => {
    receivedArgs = args;
    return Promise.resolve(updated);
  };

  const result = await userRepository.updateAccountStatus(
    "user-1",
    AccountStatus.Deactivated,
  );

  assert.equal(result, updated);
  assert.deepEqual(receivedArgs, [
    "user-1",
    { $set: { accountStatus: AccountStatus.Deactivated } },
    { new: true },
  ]);
});
