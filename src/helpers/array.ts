type OffsetArrayData<T> = {
    array: T[];
    currentOffset: number;
    offsetSize: number;
};

/**
 * Return array with applied offset
 *
 * @param array Array to apply offset
 * @param currentOffset Current offset value
 * @param offsetSize Size for incrementing current offset
 * @returns Object with applied offset for array and new offset value (or undefined, if hit end of array)
 */
export function offsetArray<T>({
    array,
    currentOffset,
    offsetSize,
}: OffsetArrayData<T>) {
    const nextOffset = currentOffset + offsetSize;
    const slicedArray = array.slice(currentOffset, nextOffset);
    const newOffset =
        array.length > nextOffset ? String(nextOffset) : undefined;

    return {
        array: slicedArray,
        nextOffset: newOffset,
    };
}
