export const createEntries = (arr1, arr2) => {
  let entries = [];
  for (let i = 0; i < arr1.length; i++) {
    entries.push([arr1[i], arr2[i]]);
  }
  return new Map(entries);
};

export const transformRowsArray = (array) => {
  const headerKeys = array[0];
  const rows = array.slice(1);
  const rowsObjects = rows.map((row, index) => {
    return Object.fromEntries(createEntries(headerKeys, row));
  });
  return rowsObjects;
};
