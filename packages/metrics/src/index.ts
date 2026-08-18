type Labels = Record<string, string>;

type Metric = { render(): string[] };

function escapeLabel(value: string) {
    return value
        .replaceAll("\\", "\\\\")
        .replaceAll('"', '\\"')
        .replaceAll("\n", "\\n");
}

function formatLabels(names: readonly string[], labels: Labels) {
    if (names.length === 0) return "";
    return `{${names.map((name) => `${name}="${escapeLabel(labels[name] ?? "")}"`).join(",")}}`;
}

function labelKey(names: readonly string[], labels: Labels) {
    return names.map((name) => labels[name] ?? "").join("\u0000");
}

abstract class LabeledMetric implements Metric {
    protected readonly values = new Map<
        string,
        { labels: Labels; value: number }
    >();

    protected readonly name: string;
    protected readonly help: string;
    protected readonly labelNames: readonly string[];

    constructor(name: string, help: string, labelNames: readonly string[]) {
        this.name = name;
        this.help = help;
        this.labelNames = labelNames;
    }

    protected add(labels: Labels, value: number) {
        const key = labelKey(this.labelNames, labels);
        const current = this.values.get(key) ?? { labels, value: 0 };
        current.value += value;
        this.values.set(key, current);
    }

    protected header(type: "counter" | "histogram") {
        return [
            `# HELP ${this.name} ${this.help}`,
            `# TYPE ${this.name} ${type}`,
        ];
    }

    abstract render(): string[];
}

export class Counter extends LabeledMetric {
    inc(labels: Labels = {}, value = 1) {
        this.add(labels, value);
    }

    render() {
        return [
            ...this.header("counter"),
            ...[...this.values.values()].map(
                ({ labels, value }) =>
                    `${this.name}${formatLabels(this.labelNames, labels)} ${value}`,
            ),
        ];
    }
}

export class Histogram extends LabeledMetric {
    private readonly bucketValues = new Map<string, number[]>();
    private readonly sums = new Map<string, number>();

    private readonly buckets: readonly number[];

    constructor(
        name: string,
        help: string,
        labelNames: readonly string[],
        buckets: readonly number[],
    ) {
        super(name, help, labelNames);
        this.buckets = buckets;
    }

    observe(labels: Labels = {}, value: number) {
        const key = labelKey(this.labelNames, labels);
        this.add(labels, 1);
        const counts = this.bucketValues.get(key) ?? this.buckets.map(() => 0);
        for (let index = 0; index < this.buckets.length; index++) {
            if (value <= this.buckets[index]) counts[index] += 1;
        }
        this.bucketValues.set(key, counts);
        this.sums.set(key, (this.sums.get(key) ?? 0) + value);
    }

    render() {
        const lines = this.header("histogram");
        for (const [key, { labels, value: count }] of this.values) {
            const counts = this.bucketValues.get(key) ?? [];
            for (let index = 0; index < this.buckets.length; index++) {
                lines.push(
                    `${this.name}_bucket${formatLabels([...this.labelNames, "le"], { ...labels, le: String(this.buckets[index]) })} ${counts[index]}`,
                );
            }
            lines.push(
                `${this.name}_bucket${formatLabels([...this.labelNames, "le"], { ...labels, le: "+Inf" })} ${count}`,
                `${this.name}_sum${formatLabels(this.labelNames, labels)} ${this.sums.get(key) ?? 0}`,
                `${this.name}_count${formatLabels(this.labelNames, labels)} ${count}`,
            );
        }
        return lines;
    }
}

/** Minimal process-local Prometheus text registry with no runtime dependencies. */
export class MetricsRegistry {
    private readonly metrics: Metric[] = [];

    counter(name: string, help: string, labelNames: readonly string[] = []) {
        const metric = new Counter(name, help, labelNames);
        this.metrics.push(metric);
        return metric;
    }

    histogram(
        name: string,
        help: string,
        labelNames: readonly string[] = [],
        buckets = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
    ) {
        const metric = new Histogram(name, help, labelNames, buckets);
        this.metrics.push(metric);
        return metric;
    }

    render() {
        return `${this.metrics.flatMap((metric) => metric.render()).join("\n")}\n`;
    }
}
