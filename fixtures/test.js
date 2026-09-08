import { test as base, expect } from '@playwright/test';
import { epic, feature, story, parameter, label } from 'allure-js-commons';
import path from 'path';

export { expect };
export const test = base;

const EPIC_MAP = {
  CustomerTestCases: 'Customer',
  AdminTestCases: 'Admin',
  SuppliersTestCases: 'Suppliers',
  'Commercial contract sales': 'Commercial Contract Sales',
};

function getEpicFromFile(filePath) {
  const folder = path.basename(path.dirname(filePath));
  if (EPIC_MAP[folder]) return EPIC_MAP[folder];
  if (folder === 'tests') return path.basename(filePath, '.spec.js');
  return folder;
}

test.beforeEach(async ({}, testInfo) => {
  await epic(getEpicFromFile(testInfo.file));
  await feature(testInfo.titlePath[0] || path.basename(testInfo.file, '.spec.js'));
  await story(testInfo.title);
  await label('browser', testInfo.project.name);
  await parameter('Browser', testInfo.project.name);
});
