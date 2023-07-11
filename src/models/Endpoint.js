import { Client } from 'iobio-api-client';

export default class EndpointCmd {

  constructor(globalApp, genomeBuildHelper) {
    this.globalApp         = globalApp;
    this.genomeBuildHelper = genomeBuildHelper;
    this.api = new Client(this.globalApp.IOBIO_SERVICES);
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


}


