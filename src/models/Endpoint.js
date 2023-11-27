import { Client } from 'iobio-api-client';

export default class EndpointCmd {

  constructor(globalApp, genomeBuildHelper) {
    this.globalApp         = globalApp;
    this.genomeBuildHelper = genomeBuildHelper;
    //this.api = new Client(this.globalApp.IOBIO_SERVICES);
    this.apiSandbox = new Client('https://mosaic.chpc.utah.edu/gru-dev-9002')
    this.api        = new Client('https://mosaic.chpc.utah.edu/gru/api/v1')
  }


  promiseGetBedRegion(bedUrl, indexUrl, region) {
    const self = this;
    return new Promise(function(resolve, reject) {
      let cmd = self.api.streamCommand('bedRegion', {'url': bedUrl, 'indexUrl': indexUrl, 'region': region});

      let buffer = "";
      let success = false;
      cmd.on('data', function(data) {
        if (data != undefined) {
          success = true;
          buffer += data;
        }
      });

      cmd.on('end', function() {
        if (success == null) {
          success = true;
        }
        if (success && buffer.length > 0) {
          let bedRecs= [];
          buffer.split("\n")
          .forEach(function(rec) {
            let tokens = rec.split("\t")
            if (tokens.length >= 5) {
              let ref    = tokens[0];
              let start  = tokens[1];
              let end    = tokens[2];
              let annots = tokens[3];
              let score  = tokens[4];
              let strand = tokens[5];

              let annotTokens = annots.split(";")
              let annotObj = {};
              annotTokens.forEach(function(annotToken) {
                let tagValueTokens = annotToken.split("=");
                annotObj[tagValueTokens[0]] = tagValueTokens[1];
              })
              bedRecs.push( {'ref': ref,
                      'start':     +start,
                      'end':       +end,
                      'annots':    annotObj,
                      'score':     +score,
                      'strand':    strand} );

            } else {
              console.log('Bypassing bed rec. Expecting 6 columns')
            }
          })

          resolve(bedRecs);
        } else if (buffer.length == 0) {
          reject({'message': "No data returned from backend service bedRegion"});
        }
      });

      cmd.on('error', function(error) {
        let msgObj = {'message': "Backend service bedRegion failed",
                      'details': error.toString()}
        reject(msgObj);
      });

      cmd.run();

    })
  }


  promiseGetReferenceSequence(refName, region) {
    const self = this;
    return new Promise(function(resolve, reject) {
      const refFastaFile = self.genomeBuildHelper.getFastaPath(refName);
      let cmd = self.apiSandbox.streamCommand('getReferenceSequence', {'fastaPath': refFastaFile,  'region': region});

      let buffer = "";
      let success = false;
      let records = null;
      cmd.on('data', function(data) {
        if (data != undefined) {
          success = true;
          buffer += data;
        }
      });

      cmd.on('end', function() {
        if (success == null) {
          success = true;
        }
        if (success && buffer.length > 0) {
          records = buffer.split("\n")

          let finalRecords = [];
          if (records.length >= 1) {
            finalRecords.push(records[0])
            let sequence = ""
            for (let idx = 1; idx < records.length; idx++) {
              sequence += records[idx]
            }
            finalRecords.push(sequence)
          }

          resolve(finalRecords);
        } else if (buffer.length == 0) {
          reject({'message': "No data returned from backend service getReferenceSequence"});
        }
      });

      cmd.on('error', function(error) {
        let msgObj = {'message': "Backend service getReferenceSequence failed",
                      'details': error.toString()}
        reject(msgObj);
      });

      cmd.run();

    })
  }

  promiseAnnotateVariants(vcfUrl, indexUrl, refName, regions, vcfSampleNames, getDetailedAnnots=false) {
    let self = this;
    return new Promise(function(resolve, reject) {

      const refNames        = self.getHumanRefNames(refName).split(" ");
      const genomeBuildName = self.genomeBuildHelper.getCurrentBuildName();
      const refFastaFile    = self.genomeBuildHelper.getFastaPath(refName);
      
      const cmd = this.api.streamCommand('annotateVariantsV2', {
          vcfUrl: vcfUrl,
          tbiUrl: indexUrl,
          refNames,
          regions,
          vcfSampleNames: vcfSampleNames.split(','),
          refFastaFile,
          genomeBuildName,
          isRefSeq: getDetailedAnnots, // isRefSeq
          hgvsNotation: getDetailedAnnots, // hgvsNotation
          getRsId: getDetailedAnnots, // getRsId
          vepAF: false, // vepAF
          sfariMode: false, // sfariMode
          vepREVELFile: self.getRevelUrl(self.genomeBuildHelper.getCurrentBuildName()),
          gnomadMergeAnnots: true, // gnomadMergeAnnots
          decompose: true, // decompose
          bypassAnnotate: false // bypassAnnotate
      });

      let buffer = "";
      let success = false;
      let records = null;
      cmd.on('data', function(data) {
        if (data != undefined) {
          success = true;
          buffer += data;
        }
      });

      cmd.on('end', function() {
        if (success == null) {
          success = true;
        }
        if (success && buffer.length > 0) {
          records = buffer.split("\n")
          resolve(records);
        } else if (buffer.length == 0) {
          reject({'message': "No data returned from backend service annotateVariants"});
        }
      });

      cmd.on('error', function(error) {
        let msgObj = {'message': "Backend service annotateVariants failed",
                      'details': error.toString()}
        reject(msgObj);
      });

      cmd.run();




    })
  }

  getRevelUrl(build) {
    return './vep-cache/' + build + '_revel_all_chromosomes_for_vep.tsv.gz';
  }

  getHumanRefNames(refName) {
    if (refName.indexOf("chr") == 0) {
      return "chr1 chr2 chr3 chr4 chr5 chr6 chr7 chr8 chr9 chr10 chr11 chr12 chr13 chr14 chr15 chr16 chr17 chr18 chr20 chr21 chr22 chrX chrY";
    } else {
      return "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 X Y";
    }
  }




}


