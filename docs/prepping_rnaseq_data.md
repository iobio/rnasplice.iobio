
# Prepping RNASeq data for RNAsplice.iobio

The document outlines the steps currently in use at the Utah Center
for Genetic Discovery to prepare RNASeq data for analysis with
RNASplice.iobio.

### Align sequence reads

RNASeq fastq files are aligned with STAR using the basic two-pass
method and saved as coordinate sorted BAM files.

* input:
  * r1='FASTQ/{sample}.R1.fastq.gz',
  * r2='FASTQ/{sample}.R2.fastq.gz',
  * ref='STAR_Genome/Genome',
* output:
  * 'STAR_Output/{sample}.Aligned.sortedByCoord.out.bam',
  * 'STAR_Output/{sample}.SJ.out.tab',

```
STAR --runThreadN {threads} --genomeDir STAR_Genome \
--genomeLoad NoSharedMemory --outFileNamePrefix STAR_Output/{wildcards.sample}. \
--twopassMode Basic --outSAMstrandField intronMotif --readFilesCommand zcat \
--outSAMtype BAM SortedByCoordinate --readFilesIn {input.r1} {input.r2} &> {log}
```

### Index BAM files

Samtools is used to index the BAM files.

* input: 'STAR_Output/{sample}.Aligned.sortedByCoord.out.bam',
* output: 'STAR_Output/{sample}.Aligned.sortedByCoord.out.bam.bai',

```
samtools index {input} &> {log}
```

### Create a splice-juction BED file

A custom python script is used to convert the STAR splice-junction TSV
file (*.SV.out.tab) into an IGV compatible splice-junction BED file.
The script is available on GitHub and comments in the code describe
the input and output file formats in detail.

https://github.com/barrymoore/catherpes/blob/main/scripts/create_igv_junc_bed.py

* input: 'STAR_Output/{sample}.SJ.out.tab',
* output: 'STAR_Output/{sample}.SJ.out.bed.gz',

```
create_igv_junc_bed.py {input} | bgzip > {output} 2> {log}
tabix {output}
```

### Make BigWig file of BAM coverage

The bamCoverage tool from the deepTools library is used to create a
BigWig file of coverage from the BAM file.

https://deeptools.readthedocs.io/en/develop/content/tools/bamCoverage.html

* input:
  * bam='STAR_Output/{sample}.Aligned.sortedByCoord.out.bam',
  * bai='STAR_Output/{sample}.Aligned.sortedByCoord.out.bam.bai',
* output:
  * 'STAR_Output/{sample}.Aligned.out.bw',

```
bamCoverage -b {input.bam} -o {output} 2> {log}'
```