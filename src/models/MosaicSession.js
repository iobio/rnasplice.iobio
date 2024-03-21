
export default class MosaicSession {
  constructor() {
    this.samples = null;
    this.url = null;
    this.apiVersion =  '/apiv1';
    this.client_application_id = null;
    this.user = null;
    this.globalApp = null;
  }

  promiseInit(sampleId, source, projectId, geneSetId, experimentId, buildName ) {
    let self = this;
    self.api = source + self.apiVersion;

    return new Promise((resolve, reject) => {
      let geneSet = null;
      self.promiseGetCurrentUser()
      .then(function(data) {
        self.user = data;
      })
      .catch(function(error) {
        console.log(error)
      })

      self.promiseGetClientApplication()
      .then(function() {
        if (geneSetId) {
          return self.promiseGetGeneSet(projectId, geneSetId)
        } else {
          return Promise.resolve(null);
        }
      })
      .then(function(data) {
        geneSet = data;

        self.promiseGetSampleInfo(projectId, sampleId, false).then(data => {
          // Let's get the proband info first
          let theSample = data.proband;
          self.promiseGetFileMapForSample(projectId, probandSample, 'proband', experimentId)
          .then(data => {
            theSample.files = data.fileMap;
            let loadInfo = {
                        'buildName':   buildName,
                        'bedURL':      theSample.files['bed.gz'],
                        'bedIndexURL': theSample.files['bed.gz.tbi'],
                        'bigwigURL':   theSample.files['bw'],
                        'vcfURL':      theSample.files['vcf'],
                        'tbiURL':      theSample.files['tbi'],
                        'sampleName':  theSample.name}
            if (theSample.files.bam != null) {
              loadInfo.bam = theSample.files.bam;
              if (theSample.files.bai) {
                loadInfo.bai = theSample.files.bai;
              }
            } else if (theSample.files.cram != null) {
              loadInfo.bam = theSample.files.cram;
              if (theSample.files.crai) {
                loadInfo.bai = theSample.files.crai;
              }
            }

            resolve({'loadInfo': loadInfo,  'geneSet': geneSet, 'user': self.user});
          })
          .catch(error => {
            reject(error);
          })
        })
      })

    })

  }

  hasVariantSets(modelInfos, rel='proband') {
    let proband = modelInfos.filter(function(mi) {
      return mi.relationship == rel;
    })
    if (proband && proband.length > 0) {
      let fileInfos = proband[0].txt;
      return fileInfos && fileInfos.length > 0
    } else {
      return false;
    }
  }

  promiseParseVariantSets(modelInfos, rel='proband') {
    let self = this;
    return new Promise(function(resolve,reject) {
      let proband = modelInfos.filter(function(mi) {
        return mi.relationship == rel;
      })
      let variantSets = {};
      if (proband && proband.length > 0) {
        var promises = [];
        let fileInfos = proband[0].txt;
        fileInfos.forEach(function(fileInfo) {
          let p = self.promiseParseVariantSetFile(fileInfo, proband[0])
          .then(function(data) {
            if (data) {
              variantSets[data.nickname] = data.records;
            }
          })
          promises.push(p);
        })
        Promise.all(promises)
        .then(function() {
          resolve(variantSets)
        })
      } else {
        resolve(variantSets);
      }

    })
  }



  promiseGetClientApplication() {
    let self = this;
    return new Promise(function(resolve, reject) {
      $.ajax({
        url: self.api + '/client-applications',
        type: 'GET',
        contentType: 'application/json',
        headers: {
          Authorization: localStorage.getItem('hub-iobio-tkn'),
        },
      })
      .done(data => {
        let clientApps = data.data;
        let matchingApp = clientApps.filter(function(clientApp) {
          return clientApp.display_name == 'rnasplice.iobio';
        })
        if (matchingApp.length > 0) {
          console.log("client_application_id = " + matchingApp[0].id)
          self.client_application_id = matchingApp[0].id;
          resolve();
        } else {
          reject("Cannot find Mosaic client_application for rnasplice.iobio")
        }

      })
      .fail(error => {
        console.log("Error getting applications ");
        console.log(error);
        reject(error);
      })

    })
  }


  promiseGetProject(project_id) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getProject(project_id)
      .done(data => {
          resolve(data);
      })
      .fail(error => {
        reject("Error getting project " + project_id + ": " + error);
      });
    });
  }

  promiseGetSampleInfo(project_id, sample_id, isPedigree) {
    let self = this;
    if (isPedigree) {
      return self.promiseGetPedigreeForSample(project_id, sample_id);
    } else {
      return self.promiseGetSample(project_id, sample_id, 'proband');
    }
  }

  promiseGetSample(project_id, sample_id, rel) {
    let self = this;

    return new Promise(function(resolve, reject) {
      // Get pedigree for sample
      self.getSample(project_id, sample_id)
      .done(data => {
        if (rel) {
          let sample = {};
          sample[rel] = data;
          resolve(sample);
        } else {
          resolve(data);
        }
      })
      .fail(error => {
        reject("Error getting sample " + sample_id + ": " + error);
      })
    })
  }

  promiseGetPedigreeForSample(project_id, sample_id) {
    let self = this;

    return new Promise(function(resolve, reject) {
      // Get pedigree for sample
      self.getPedigreeForSample(project_id, sample_id)
      .done(rawPedigree => {
        const rawPedigreeOrig = $.extend({}, rawPedigree);
        let pedigree = self.parsePedigree(rawPedigree, sample_id)
        if (pedigree) {
          resolve({pedigree: pedigree, rawPedigree: rawPedigreeOrig});
        } else {
          reject("Error parsing pedigree");
        }
      })
      .fail(error => {
        reject("Error getting pedigree for sample " + sample_id + ": " + error);
      })
    })
  }

  parsePedigree(raw_pedigree, sample_id) {

    // This assumes only 1 proband. If there are multiple affected samples then
    // the proband will be overwritten
    // This also assume no grandparents/grandchildren

    let pedigree = {}

    // Look for proband, which should have mother and father filled in and is the sample selected
    let probandIndex = raw_pedigree.findIndex(d => ( d.id == sample_id && d.pedigree.maternal_id && d.pedigree.paternal_id ) );
    // If the sample selected doesn't have a mother and father (isn't a proband), find
    // the proband by looking for a child with mother and father filled in and affected status
    if (probandIndex == -1) {
      probandIndex = raw_pedigree.findIndex(d => ( d.pedigree.affection_status == 2 && (d.pedigree.maternal_id || d.pedigree.paternal_id )) );
    }
    // If the sample selected doesn't have a mother and father (isn't a proband), find
    // the proband by looking for a child with mother and father filled in and unknown affected status
    if (probandIndex == -1) {
      probandIndex = raw_pedigree.findIndex(d => ( d.pedigree.affection_status == 0 && (d.pedigree.maternal_id || d.pedigree.paternal_id ) ));
    }

    if (probandIndex == -1) {
      // Assume proband if there is only one sample in the pedigree
      if (raw_pedigree.length == 1) {
        probandIndex = 0;
      }
    }


    if (probandIndex != -1) {
      // Proband
      const proband  = raw_pedigree.splice(probandIndex, 1)[0];
      pedigree['proband'] = proband;

      // Get mother
      const motherIndex = raw_pedigree.findIndex(d => d.id == proband.pedigree.maternal_id)
      if (motherIndex != -1) {
        pedigree['mother'] = raw_pedigree.splice(motherIndex, 1)[0]
        this.isMother = true;
      }

      // Get mother
      const fatherIndex = raw_pedigree.findIndex(d => d.id == proband.pedigree.paternal_id)
      if (fatherIndex != -1) {
        pedigree['father'] = raw_pedigree.splice(fatherIndex, 1)[0]
        this.isFather = true;
      }
    } else {
      alertify.alert("Error", "Could not load the trio.  Unable to identify a proband (offspring) from this pedigree.")
      return null;
    }

    raw_pedigree.forEach(sample => {
      if (sample.pedigree.maternal_id != null || sample.pedigree.paternal_id != null
          && sample.pedigree.id != pedigree.proband.id) {
        pedigree['siblings'] = (pedigree['siblings'] || [] )
        pedigree['siblings'].push(sample);
      } else {
        pedigree['unparsed'] = (pedigree['siblings'] || []).push(sample)
      }
    })


    return pedigree;
  }

  getPedigreeForSample(project_id, sample_id) {
    let self = this;
    return $.ajax({
      url: self.api + '/projects/' + project_id +  '/samples/' + sample_id + '/pedigree',
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': localStorage.getItem('hub-iobio-tkn')
      }
    });
  }


  getSample(project_id, sample_id) {
    let self = this;
    return $.ajax({
      url: self.api + '/projects/' + project_id + '/samples/' + sample_id,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': localStorage.getItem('hub-iobio-tkn')
      }
    });
  }


  promiseGetFileMapForSample(project_id, sample, relationship, experimentId) {
    let self = this;
    return new Promise((resolve,reject) => {
      var promises = [];
      var fileMap = {};
      var currentSample = sample;
      self.promiseGetFilesForSample(project_id, currentSample.id)
      .then(files => {
        files.filter(file => {
          return file.type
        })
        .filter(file =>  {
          if (experimentId) {
            return file.experimentId == experimentId
          } else {
            return true;
          }
        })
        .forEach(file => {

          var p = self.promiseGetSignedUrlForFile(project_id, currentSample.id, file)
          .then(signed => {
            if (file.type == 'txt' || file.type == 'tsv') {
              var files = fileMap.txt;
              if (files == null) {
                files = [];
                fileMap.txt = files;
              }
              files.push({'url': signed.url, 'name': file.nickname});

            } else {
              fileMap[file.type] = signed.url
              if (file.type == 'vcf') {
                if (file.vcf_sample_name == null || file.vcf_sample_name == "") {
                  alertify.error("Missing vcf_sample_name for file " + file.name, 20)
                } else {
                  sample.vcf_sample_name = file.vcf_sample_name;
                }
              }
            }
          })
          promises.push(p);
        })
        Promise.all(promises)
        .then(response => {
          resolve({'sample': sample, 'relationship': relationship, 'fileMap': fileMap});
        })
        .catch(error => {
          reject(error);
        })
      })
    })
  }



  promiseGetFilesForSample(project_id, sample_id) {
    let self = this;
    return new Promise((resolve,reject) => {
      self.getFilesForSample(project_id, sample_id)
      .done(response => {
        resolve(response.data);
      })
      .fail(error => {
        console.log("Unable to get files for sample " + sample_id)
        reject(error);
      })
    })
  }


  getFilesForSample(project_id, sample_id) {
    let self = this;
    return $.ajax({
      url: self.api +  '/samples/' + sample_id + '/files',
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': localStorage.getItem('hub-iobio-tkn')
      }
    });
  }

  promiseGetFilesForProject(project_id) {
      let self = this;
      return new Promise((resolve,reject) => {
          self.getFilesForProject(project_id)
              .done(response => {
                  resolve(response);
              })
              .fail(error => {
                  console.log("Unable to get files for project " + project_id);
                  reject(error);
              })
      })
  }


  getFilesForProject(project_id) {
      let self = this;
      return $.ajax({
          url: self.api +  '/projects/' + project_id + '/files',
          type: 'GET',
          contentType: 'application/json',
          headers: {
              'Authorization': localStorage.getItem('hub-iobio-tkn')
          }
      });
  }

  promiseGetSignedUrlForFile(project_id, sample_id, file) {
    let self = this;
    return new Promise((resolve, reject) => {
      self.getSignedUrlForFile(project_id, sample_id, file)
      .done(file => {
        resolve(file);
      })
      .fail(error => {
        reject(error);
      })
    })
  }

  getSignedUrlForFile (project_id, sample_id, file) {
    let self = this;
    return $.ajax({
      url: self.api +  '/projects/' + project_id + '/files/' + file.id + '/url',
      type: 'GET',
      contentType: 'application/json',
      headers: {
        'Authorization': localStorage.getItem('hub-iobio-tkn')
      }
    });
  }

  getProject(projectId) {
    let self = this;
    return $.ajax({
        url: self.api + '/projects/' + projectId,
        type: 'GET',
        contentType: 'application/json',
        headers: {
            'Authorization': localStorage.getItem('hub-iobio-tkn')
        }
    });
  }

  promiseGetGeneSet(projectId, geneSetId) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getGeneSet(projectId, geneSetId)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        reject("Error getting gene set " + geneSetId + ": " + error);
      })
    })

  }

  promiseGetAnalysis(projectId, analysisId) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getAnalysis(projectId, analysisId)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        reject("Error getting analysis " + analysisId + ": " + error);
      })
    })

  }
  promiseAddAnalysis(projectId, analysis) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.addAnalysis(projectId, analysis)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        reject("Error adding analysis for project " + projectId + ": " + error);
      })
    })

  }

  promiseUpdateAnalysis(analysis) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.updateAnalysis(analysis.project_id, analysis.id, analysis)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        reject("Error updating analysis " + analysis.id  + ": " + error);
      })
    })

  }

  promiseUpdateAnalysisTitle(analysis) {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.updateAnalysisTitle(analysis.project_id, analysis.id, analysis)
      .done(response => {
        resolve(response)
      })
      .fail(error => {
        reject("Error updating analysis title " + analysis.id + ": " + error);
      })
    })

  }

  getAnalysis(projectId, analysisId) {
    let self = this;
    return $.ajax({
      url: self.api + '/projects/' + projectId  + '/analyses/' + analysisId,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    })
  }




  addAnalysis(projectId, newAnalysisData) {
    let self = this;

    return $.ajax({
      url: self.api + '/projects/' + projectId + '/analyses/?client_application_id=' + this.client_application_id,
      type: 'POST',
      data: self.stringifyAnalysis(newAnalysisData),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    });
  }

  updateAnalysisTitle(projectId, analysisId, newAnalysisData) {
    let self = this;

    return $.ajax({
      url: self.api + '/projects/' + projectId + '/analyses/' + analysisId,
      type: 'PUT',
      data: self.stringifyAnalysis(newAnalysisData),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    });
  }


  updateAnalysis(projectId, analysisId, newAnalysisData) {
    let self = this;

    return $.ajax({
      url: self.api + '/projects/' + projectId + '/analyses/' + analysisId
            + '?client_application_id=' + this.client_application_id,
      type: 'PUT',
      data: self.stringifyAnalysis(newAnalysisData),
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    });
  }

  promiseGetCurrentUser() {
    let self = this;
    return new Promise(function(resolve, reject) {
      self.getCurrentUser()
        .done(response => {
          resolve(response)
        })
        .fail(error => {
          reject("Error getting currentUser :" + error);
        })
    })
  }

  getCurrentUser() {
    let self = this;

    return $.ajax({
      url: self.api + '/user',
      type: 'GET',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    });

  }

  getGeneSet(projectId, geneSetId) {
    let self = this;

    return $.ajax({
      url: self.api + '/projects/' + projectId + '/genes/sets/' + geneSetId,
      type: 'GET',
      contentType: 'application/json',
      headers: {
        Authorization: localStorage.getItem('hub-iobio-tkn'),
      },
    });
  }

  stringifyAnalysis(analysisData) {
    let self = this;
    var cache = [];

    let analysisDataCopy = $.extend({}, analysisData)

    // First get rid of full gene and transcript objects from variants
    // These are too big to stringify and store
    analysisDataCopy.payload.variants.forEach(function(variant) {
      if (variant.gene && self.globalApp.utility.isObject(variant.gene)) {
        variant.gene = variant.gene.gene_name;
      }
      if (variant.transcript && self.globalApp.utility.isObject(variant.transcript)) {
        variant.transcriptId = variant.transcript.transcript_id;
        variant.transcript = null;
      }
//      variant.variantInspect = null;
      if (variant.variantInspect && variant.variantInspect.geneObject) {
        variant.variantInspect.geneName = variant.variantInspect.geneObject.gene_name
        variant.variantInspect.geneObject = null;
      }
      if (variant.variantInspect && variant.variantInspect.transcriptObject) {
        variant.variantInspect.transcriptId = variant.variantInspect.transcriptObject.transcript_id
        variant.variantInspect.transcriptObject = null;
      }
    })
    analysisDataCopy.payload.filters = null;


    let analysisString = JSON.stringify(analysisDataCopy, function(key, value) {
      if (typeof value === 'object' && value !== null) {
          if (cache.indexOf(value) !== -1) {
              // Circular reference found, discard key
              return;
          }
          // Store value in our collection
          cache.push(value);
      }
      return value;
    });
    cache = [];
    return analysisString;
  }


}
