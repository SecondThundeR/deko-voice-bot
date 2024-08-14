type OffsetArrayOptions<T> = {
    array: T[];
    currentOffset: number;
    offsetSize: number;
};

export function offsetArray<T>({
    array,
    currentOffset,
    offsetSize,
}: OffsetArrayOptions<T>) {
    const nextOffset = currentOffset + offsetSize;

    return {
        array: array.slice(currentOffset, nextOffset),
        nextOffset: array.length > nextOffset ? String(nextOffset) : undefined,
    };
}
