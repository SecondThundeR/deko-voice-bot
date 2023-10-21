/**
 * Return array with applied offset
 *
 * @param array Array to apply offset
 * @param currentOffset Current offset value
 * @param offsetSize Size for incrementing current offset
 * @returns Object with applied offset for array and new offset value (or undefined, if hit end of array)
 */
export function offsetArray<T>(
  array: T[],
  currentOffset: number,
  offsetSize: number
) {
  const nextOffset = currentOffset + offsetSize;
  return {
    array: array.slice(currentOffset, nextOffset),
    nextOffset: array.length > nextOffset ? String(nextOffset) : undefined,
  };
}
