import { MAX_QUERY_ELEMENTS_PER_PAGE } from "@/src/constants/inline";

export function getArrayWithOffset<T>(
    array: T[],
    currentOffset: number,
    offsetSize = MAX_QUERY_ELEMENTS_PER_PAGE,
) {
    const nextOffset = currentOffset + offsetSize;

    return {
        array: array.slice(currentOffset, nextOffset),
        nextOffset: array.length > nextOffset ? nextOffset : undefined,
    };
}
