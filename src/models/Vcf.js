//
//  Vcf

import { createHoster } from 'fibridge-host';

export default function Vcf(theGlobalApp) {

  var globalApp = theGlobalApp;

  var debug =  false;

  var exports = {};

  var dispatch = d3.dispatch( 'dataReady', 'dataLoading');

  var SOURCE_TYPE_URL = "URL";
  var SOURCE_TYPE_FILE = "file";
  var sourceType = "url";

  var vcfURL;
  var tbiUrl;

  var refData = [];
  var refDensity = [];
  var refName = "";
  var infoFields =  {};
  var contigRecords = [];

  var infoOrFormat = {};
  var infoDict = {};
  var formatDict = {};

  var regions = [];
  var regionIndex = 0;
  var stream = null;

  var endpoint = null;
  var genericAnnotation = null;
  var genomeBuildHelper = null;




  var VEP_FIELDS_AF_1000G  = "AF|AFR_AF|AMR_AF|EAS_AF|EUR_AF|SAS_AF".split("|");
  var VEP_FIELDS_AF_ESP    = "AA_AF|EA_AF".split("|");
  var VEP_FIELDS_AF_GNOMAD = "gnomAD_AF|gnomAD_AFR_AF|gnomAD_AMR_AF|gnomAD_ASJ_AF|gnomAD_EAS_AF|gnomAD_FIN_AF|gnomAD_NFE_AF|gnomAD_OTH_AF|gnomAD_SAS_AF".split("|");
  var VEP_FIELDS_AF_MAX    = "MAX_AF|MAX_AF_POPS".split("|");
  var VEP_FIELDS_AF_GNOMAD_GENOMES = "gnomADg_AF|gnomADg_AN|gnomADg_AC|gnomADg_nhomalt_raw|gnomADg_nhomalt-raw|gnomADg_AF_popmax|gnomADg_faf95_popmax|gnomADg_AC_fin|gnomADg_AC_nfe|gnomADg_AC_oth|gnomADg_AC_amr|gnomADg_AC_afr|gnomADg_AC_asj|gnomADg_AC_eas|gnomADg_AC_sas|gnomADg_AC_fin|gnomADg_AN_nfe|gnomADg_AN_oth|gnomADg_AN_amr|gnomADg_AN_afr|gnomADg_AN_asj|gnomADg_AN_eas|gnomADg_AN_sas".split("|");
  var VEP_FIELDS_AF_GNOMAD_EXOMES  = "gnomADe_AF|gnomADe_AN|gnomADe_AC|gnomADe_nhomalt_raw|gnomADe_AF_popmax|gnomADe_AC_fin|gnomADe_AC_nfe|gnomADe_AC_oth|gnomADe_AC_amr|gnomADe_AC_afr|gnomADe_AC_asj|gnomADe_AC_eas|gnomADe_AC_sas|gnomADe_AC_fin|gnomADe_AN_nfe|gnomADe_AN_oth|gnomADe_AN_amr|gnomADe_AN_afr|gnomADe_AN_asj|gnomADe_AN_eas|gnomADe_AN_sas".split("|");
  var VEP_FIELDS_AF_GNOMAD_EXOMES_SLIM  = "gnomADe_AF|gnomADe_AN|gnomADe_AC|gnomADe_nhomalt_raw|gnomADe_AF_popmax".split("|");
    

  var CLINVAR_CODES = {
    '0':   'not_provided',
    '1':   'not_provided',
    '2':   'benign',
    '3':   'likely_benign',
    '4':   'likely_pathogenic',
    '5':   'pathogenic',
    '6':   'drug_response',
    '7':   'other',
    '255': 'other'
  }

  
  var GNOMAD_TAGS = {
    'GRCh37': {
      'gnomAD_AF':          'af',
      'gnomAD_AC':          'altCount',
      'gnomAD_AN':          'totalCount',
      'gnomAD_nhomalt_raw': 'homCount',
      //'nhomalt-raw': 'homCount',
      'gnomAD_AF_popmax':   'afPopMax',

      'gnomAD_AF_fin': ['pop', 'fin', 'af'],
      'gnomAD_AC_fin': ['pop', 'fin', 'altCount'],
      'gnomAD_AN_fin': ['pop', 'fin', 'totalCount'],

      'gnomAD_AF_nfe': ['pop', 'nfe', 'af'],
      'gnomAD_AC_nfe': ['pop', 'nfe', 'altCount'],
      'gnomAD_AN_nfe': ['pop', 'nfe', 'totalCount'],

      'gnomAD_AF_oth': ['pop', 'oth', 'af'],
      'gnomAD_AC_oth': ['pop', 'oth', 'altCount'],
      'gnomAD_AN_oth': ['pop', 'oth', 'totalCount'],

      'gnomAD_AF_amr': ['pop', 'amr', 'af'],
      'gnomAD_AC_amr': ['pop', 'amr', 'altCount'],
      'gnomAD_AN_amr': ['pop', 'amr', 'totalCount'],

      'gnomAD_AF_afr': ['pop', 'afr', 'af'],
      'gnomAD_AC_afr': ['pop', 'afr', 'altCount'],
      'gnomAD_AN_afr': ['pop', 'afr', 'totalCount'],

      'gnomAD_AF_asj': ['pop', 'asj', 'af'],
      'gnomAD_AC_asj': ['pop', 'asj', 'altCount'],
      'gnomAD_AN_asj': ['pop', 'asj', 'totalCount'],

      'gnomAD_AF_eas': ['pop', 'eas', 'af'],
      'gnomAD_AC_eas': ['pop', 'eas', 'altCount'],
      'gnomAD_AN_eas': ['pop', 'eas', 'totalCount'],

      'gnomAD_AF_sas': ['pop', 'sas', 'af'],
      'gnomAD_AC_sas': ['pop', 'sas', 'altCount'],
      'gnomAD_AN_sas': ['pop', 'sas', 'totalCount'],
    },
  'GRCh38':       {
      'gnomAD_AF':          'af',
      'gnomAD_AC':          'altCount',
      'gnomAD_AN':          'totalCount',
      'gnomAD_nhomalt_raw': 'homCount',
      //'nhomalt-raw': 'homCount',
      'gnomAD_AF_popmax':   'afPopMax',

      'gnomAD_AF_fin': ['pop', 'fin', 'af'],
      'gnomAD_AC_fin': ['pop', 'fin', 'altCount'],
      'gnomAD_AN_fin': ['pop', 'fin', 'totalCount'],

      'gnomAD_AF_nfe': ['pop', 'nfe', 'af'],
      'gnomAD_AC_nfe': ['pop', 'nfe', 'altCount'],
      'gnomAD_AN_nfe': ['pop', 'nfe', 'totalCount'],

      'gnomAD_AF_oth': ['pop', 'oth', 'af'],
      'gnomAD_AC_oth': ['pop', 'oth', 'altCount'],
      'gnomAD_AN_oth': ['pop', 'oth', 'totalCount'],

      'gnomAD_AF_amr': ['pop', 'amr', 'af'],
      'gnomAD_AC_amr': ['pop', 'amr', 'altCount'],
      'gnomAD_AN_amr': ['pop', 'amr', 'totalCount'],

      'gnomAD_AF_afr': ['pop', 'afr', 'af'],
      'gnomAD_AC_afr': ['pop', 'afr', 'altCount'],
      'gnomAD_AN_afr': ['pop', 'afr', 'totalCount'],

      'gnomAD_AF_asj': ['pop', 'asj', 'af'],
      'gnomAD_AC_asj': ['pop', 'asj', 'altCount'],
      'gnomAD_AN_asj': ['pop', 'asj', 'totalCount'],

      'gnomAD_AF_eas': ['pop', 'eas', 'af'],
      'gnomAD_AC_eas': ['pop', 'eas', 'altCount'],
      'gnomAD_AN_eas': ['pop', 'eas', 'totalCount'],

      'gnomAD_AF_sas': ['pop', 'sas', 'af'],
      'gnomAD_AC_sas': ['pop', 'sas', 'altCount'],
      'gnomAD_AN_sas': ['pop', 'sas', 'totalCount'],
    }
  }


  var effectCategories = [
    ['coding_sequence_variant', 'coding'],
    ['chromosome' ,'chromosome'],
    ['inframe_insertion'  ,'indel'],
    ['disruptive_inframe_insertion' ,'indel'],
    ['inframe_deletion' ,'indel'],
    ['disruptive_inframe_deletion'  ,'indel'],
    ['downstream_gene_variant'  ,'other'],
    ['exon_variant' ,'other'],
    ['exon_loss_variant'  ,'exon_loss'],
    ['frameshift_variant' ,'frameshift'],
    ['gene_variant' ,'other'],
    ['intergenic_region'  ,'other'],
    ['conserved_intergenic_variant' ,'other'],
    ['intragenic_variant' ,'other'],
    ['intron_variant' ,'other'],
    ['conserved_intron_variant' ,'other'],
    ['miRNA','other'],
    ['missense_variant' ,'missense'],
    ['initiator_codon_variant'  ,'missense'],
    ['stop_retained_variant'  ,'missense'],
    ['rare_amino_acid_variant'  ,'rare_amino_acid'],
    ['splice_acceptor_variant'  ,'splice_acceptor'],
    ['splice_donor_variant' ,'splice_donor'],
    ['splice_region_variant'  ,'splice_region'],
    ['stop_lost'  ,'stop_lost'],
    ['5_prime_UTR_premature start_codon_gain_variant' ,'utr'],
    ['start_lost' ,'start_lost'],
    ['stop_gained'  ,'stop_gained'],
    ['synonymous_variant' ,'synonymous'],
    ['start_retained' ,'synonymous'],
    ['stop_retained_variant'  ,'synonymous'],
    ['transcript_variant' ,'other'],
    ['regulatory_region_variant'  ,'regulatory'],
    ['upstream_gene_variant'  ,'other'],
    ['3_prime_UTR_variant'  ,'utr'],
    ['3_prime_UTR_truncation +','utr'],
    ['5_prime_UTR_variant'  ,'utr'],
    ['5_prime_UTR_truncation +','utr']
  ];

    // Valid CLNSIG fields as of May 2021
    var CLNSIG_TERMS = {
      'clinvar_affects': 'Affects',
      'clinvar_assoc': 'Association',
      'clinvar_no_assoc': 'Association_not_found',
      'clinvar_benign': 'Benign',
      'clinvar_confers_sens': 'Confers_sensitivity',
      'clinvar_cd': 'Conflicting_data_from_submitters',
      'clinvar_drug_resp': 'Drug_response',
      'clinvar_lbenign': 'Likely_benign',
      'clinvar_lpath': 'Likely_pathogenic',
      'clinvar_other': 'Other',
      'clinvar_not_provided': 'Not_provided',
      'clinvar_path': 'Pathogenic',
      'clinvar_protective': 'Protective',
      'clinvar_risk_factor': 'Risk_factor',
      'clinvar_uc': 'Uncertain_significance'
  };


  exports.hasUrl = function() {
    return vcfURL != null;
  }

  exports.clear = function() {
    vcfURL = null;
    tbiUrl = null;
  }

  exports.clearVcfURL = function() {
    vcfURL = null;
    tbiUrl = null;
  }

  exports.setEndpoint = function(theEndpoint) {
    endpoint = theEndpoint;
  }

  exports.getEndpoint = function() {
    return endpoint;
  }

  exports.setGenericAnnotation = function(theGenericAnnotation) {
    genericAnnotation = theGenericAnnotation;
  }

  exports.getGenericAnnotation = function() {
    return genericAnnotation;
  }

  exports.setGenomeBuildHelper = function(theGenomeBuildHelper) {
    genomeBuildHelper = theGenomeBuildHelper;
  }

  exports.getGenomeBuildHelper = function() {
    return genomeBuildHelper;
  }
  exports.getAnnotators = function() {
    return this.infoFields ? Object.keys(this.infoFields) : [];
  }

  var errorMessageMap =  {
    "tabix Could not load .tbi": {
        regExp: /tabix\sError:\s.*:\sstderr\s-\sCould not load .tbi.*/,
        message:  "Unable to load the index (.tbi) file, which has to exist in same directory and be given the same name as the .vcf.gz with the file extension of .vcf.gz.tbi.  "
    },
     "tabix [E::hts_open]": {
        regExp:  /tabix\sError:\s.*:\sstderr\s-\s\[E::hts_open\]\sfail\sto\sopen\sfile/,
        message: "Unable to access the file.  "
     },
     "tabix [E::hts_open_format]": {
        regExp:  /tabix\sError:\s.*:\sstderr\s-\s\[E::hts_open_format\]\sfail\sto\sopen\sfile/,
        message: "Unable to access the file. "
     }
  }

  var ignoreMessages =  [
    /tabix\sError:\s.*:\sstderr\s-\s\[M::test_and_fetch\]\sdownloading\sfile\s.*/,
    /tabix\sError:\s.*:\sstderr\s-\s.*to local directory/
  ];



  exports.promiseOpenVcfUrl = function(url, theTbiUrl) {
    var me = this;

    return new Promise(function(resolve, reject) {
      sourceType = SOURCE_TYPE_URL;
      vcfURL = url;
      tbiUrl = theTbiUrl;


      return me.promiseCheckVcfUrl(url, tbiUrl) 
      .then(function() {
        resolve()
      })
      .catch(function(error) {
        reject(error)
      })
    })

  }


  exports.promiseCheckVcfUrl = function(url, tbiUrl) {
    var me = this;

    return new Promise(function(resolve, reject) {
      var buffer = "";
      var recordCount = 0;
      var success = false;

      var cmd = me.getEndpoint().getVcfHeader(url, tbiUrl);

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
          buffer.split("\n").forEach( function(rec) {
            if (rec.indexOf("##contig") == 0) {
              me._parseHeaderForContigFields(rec)
            }
            if (rec.indexOf("#") == 0) {
              me._parseHeaderForInfoFields(rec);
            }
          })
          resolve(success);
        } else if (buffer.length == 0) {
          reject("No data returned for vcf header.")
        }
      });

      cmd.on('error', function(error) {
        if (me.ignoreErrorMessage(error)) {
          resolve();
        } else {
          reject(me.translateErrorMessage(error));
        }
      });

      cmd.run();


    })

  }

  exports.ignoreErrorMessage = function(error) {
    var me = this;
    var ignore = false;
    ignoreMessages.forEach( function(regExp) {
      if (error.match(regExp)) {
        ignore = true;
      }
    });
    return ignore;

  }

  exports.translateErrorMessage = function(error) {
    var me = this;
    var message = null;
    for (var key in errorMessageMap) {
      var errMsg = errorMessageMap[key];
      if (message == null && error.match(errMsg.regExp)) {
        message = errMsg.message;
      }
    }
    return message ? message : error;
  }

  exports.clearVcfFile = function() {
    vcfReader = null;
    vcfFile = null;
    tabixFile = null;
  }

  exports.openVcfFile = function(fileSelection, callback) {
    let me = this;
    sourceType = SOURCE_TYPE_FILE;


    if (fileSelection.files.length != 2) {
       callback(false, 'must select 2 files, both a .vcf.gz and .vcf.gz.tbi/csi file');
       return;
    }

    if (endsWith(fileSelection.files[0].name, ".vcf") ||
        endsWith(fileSelection.files[1].name, ".vcf")) {
      callback(false, 'You must select a compressed vcf file (.vcf.gz), not a vcf file');
      return;
    }


    var fileType0 = /([^.]*)\.(vcf\.gz(\.tbi|\.csi)?)$/.exec(fileSelection.files[0].name);
    var fileType1 = /([^.]*)\.(vcf\.gz(\.tbi|\.csi)?)$/.exec(fileSelection.files[1].name);

    var fileExt0 = fileType0 && fileType0.length > 1 ? fileType0[2] : null;
    var fileExt1 = fileType1 && fileType1.length > 1 ? fileType1[2] : null;

    var rootFileName0 = fileType0 && fileType0.length > 1 ? fileType0[1] : null;
    var rootFileName1 = fileType1 && fileType1.length > 1 ? fileType1[1] : null;


    if (fileType0 == null || fileType0.length < 3 || fileType1 == null || fileType1.length <  3) {
      callback(false, 'You must select BOTH  a compressed vcf file (.vcf.gz) and an index (.tbi/.csi)  file');
      return;
    }


    if (fileExt0 == 'vcf.gz' && (fileExt1 == 'vcf.gz.tbi' || fileExt1 == 'vcf.gz.csi')) {
      if (rootFileName0 != rootFileName1) {
        callback(false, 'The index (.tbi) file must be named ' +  rootFileName0 + ".tbi/.csi");
        return;
      } else {
        vcfFile   = fileSelection.files[0];
        tabixFile = fileSelection.files[1];
      }
    } else if (fileExt1 == 'vcf.gz' && (fileExt0 == 'vcf.gz.tbi' || fileExt0 == 'vcf.gz.csi')) {
      if (rootFileName0 != rootFileName1) {
        callback(false, 'The index (.tbi) file must be named ' +  rootFileName1 + ".tbi/.csi");
        return;
      } else {
        vcfFile   = fileSelection.files[1];
        tabixFile = fileSelection.files[0];
      }
    } else {
      callback(false, 'You must select BOTH  a compressed vcf file (.vcf.gz) and an index (.tbi/.csi)  file');
      return;
    }

    this.processVcfFile(vcfFile, tabixFile, function(data) {
      me.promiseOpenVcfUrl(data.vcf, data.tbi)
      .then(function() {
        callback(data)
      })
      .catch(function(error) {
        callback(false, error);
      })
    })
  }


  function showFileFormatMessage() {
    alertify.set(
      {
        labels: {
          cancel     : "Show me how",
          ok         : "OK",
        },
        buttonFocus:  "cancel"
    });

    alertify.confirm("You must select a compressed vcf file and its corresponding index file in order to run this app. ",
        function (e) {
        if (e) {
            return;
        } else {
            window.location = 'http://iobio.io/2015/09/03/install-run-tabix/';
        }
     }).set('labels', {ok:'OK', cancel:'Cancel'});
  }

  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }

  exports.setSamples = function(sampleNames) {
    samples = sampleNames;
  }
  exports.getSamples = function() {
    return samples;
  }
  exports.getVcfFile = function() {
    return vcfFile;
  }
  exports.getTabixFile = function() {
    return tabixFile;
  }
  exports.setVcfFile = function(file) {
    vcfFile = file;
  }

  exports.getVcfURL = function() {
    return vcfURL;
  }

  exports.getTbiURL = function() {
    return tbiUrl;
  }

  exports.setVcfURL = function(url, tbiUrl) {
    vcfURL = url;
    tbiUrl = tbiUrl;
  }

  exports.getSourceType = function() {
    return sourceType;
  }

  exports.setSourceType = function(st) {
    sourceType = st;
  }



  function endsWith(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  }


  exports.stripChr = function(ref) {
    if (ref.indexOf("chr") == 0) {
      return ref.split("chr")[1];
    } else {
      return ref;
    }
  }


  exports.isNumeric = function(n) {
    return !isNaN(parseFloat(n)) && isFinite(n);
  }



  exports.promiseGetReferenceLengths = function() {
    if (sourceType.toLowerCase() == SOURCE_TYPE_URL.toLowerCase()) {
      return this._promiseGetChromosomes();
    } else {
      return this._promiseGetLocalReferenceLengths();
    }
  }


  exports._parseHeaderForContigFields = function(record) {
    var me = this;
    var fieldMap = {'ID': 'name', 'length': 'length', 'assembly': 'assembly'}
    if (contigRecords == null) {
      contigRecords = [];
    }
    if (record.indexOf("##contig=") >= 0) {
      record = record.replace("<", "")
      record = record.replace(">", "")
      var rest = record.split("##contig=")
      var parts = rest[1].split(",")
      var contigRecord = {};
      for (let i=0; i < parts.length; i++) {
        let part = parts[i];
        ['ID', 'length', 'assembly'].forEach(function(key) {
          if (part.indexOf(key+"=") >= 0) {
            let theValue = part.split(key+"=")[1]
            contigRecord[fieldMap[key]] = theValue;
          }
        })
      } 
      if (contigRecord.hasOwnProperty('name')) {
        contigRecords.push(contigRecord) 
      } else {
        console.log("Bypassing contig record; no ID. " + record)
      }
    } 
  }


  exports._promiseGetLocalReferenceLengths = function() {
    var me = this;

    return new Promise(function(resolve, reject) {
      vcfReader = new readBinaryVCF(tabixFile, vcfFile, function(tbiR) {
        var tbiIdx = tbiR;
        refDensity.length = 0;

        if (tbiIdx.idxContent.head.n_ref == 0) {
          var errorMsg = "Invalid index file.  The number of references is set to zero.  Try recompressing the vcf with bgzip and regenerating the index with tabix."
          console.log(errorMsg);
          reject(errorMsg);
        } else {
          var referenceNames = [];
          for (var i = 0; i < tbiIdx.idxContent.head.n_ref; i++) {
            var ref   = tbiIdx.idxContent.head.names[i];
            referenceNames.push(ref);
          }

          for (var i = 0; i < referenceNames.length; i++) {
            var ref   = referenceNames[i];

            var indexseq = tbiIdx.idxContent.indexseq[i];
            var calcRefLength = indexseq.n_intv * size16kb;


            // Load the reference density data.  Exclude reference if 0 points.
            refData.push( {"name": ref, "calcRefLength": calcRefLength, "idx": i});
          }

          // Sort ref data so that refs are ordered numerically
          refData = me.sortRefData(refData);

          resolve(refData)
        }
      });      
    })
  }

  exports._promiseGetChromosomes = function() {
    var me = this;

    return new Promise(function(resolve, reject) {
      var buffer = "";

      var cmd = me.getEndpoint().getChromosomes(vcfURL, tbiUrl);

      cmd.on('data', function(data) {
        if (data == undefined) {
          return;
        }

        buffer += data;

      })

      // All data has been streamed.
      cmd.on('end', function() {

        var recs = buffer.split("\n");
        if (recs.length > 0) {
          for (var i=0; i < recs.length; i++)  {

            var success = true;
            refData.push({"name": recs[i].trim()})
          }
        } 

        // sort refData so references or ordered numerically
        refData = me.sortRefData(refData);

        resolve(refData);
      })

      // Catch error event when fired
      cmd.on('error', function(error) {
        if(error.includes("Expected compressed file")){

          let msg = "Vcf or vcf index file is not compressed. This will prevent variants from being annotated.  Check to make sure your vcf files are properly compressed in gzip format <pre>" + vcfUrl + "</pre>";
          console.log(msg)
          reject(msg)
        }
        else{
          let msg = "Could not get chromosomes.  Make sure that your vcf.gz and gz.tbi files are accessible and properly formatted <pre>" + vcfUrl + "</pre>";
          console.log(msg)
          reject(msg)
        }

      })

      // execute command
      cmd.run();

    })




  };





  exports.sortRefData = function(refData) {
    var me = this;
    return refData.sort(function(refa,refb) {
          var x = me.stripChr(refa.name);
          var y = me.stripChr(refb.name);
          if (me.isNumeric(x) && me.isNumeric(y)) {
            return ((+x < +y) ? -1 : ((+x > +y) ? 1 : 0));
          } else {
             if (!me.isNumeric(x) && !me.isNumeric(y)) {
                return ((+x < +y) ? -1 : ((+x > +y) ? 1 : 0));
             } else if (!me.isNumeric(x)) {
                return 1;
             } else {
                return -1;
             }
          }

      });
  }


  /* Returns filter phrase compatible with bcftools filter function. Filters by CLNSIG field.
   * By default, returns pathogenic and likely pathogenic filters.
   * Refer to CLNSIG_TERMS dictionary at file head for valid terms. */
  exports.getPathogenicityFilter = function(pathogenicityFilters) {
    let validFilters = [];

    if (pathogenicityFilters) {
      pathogenicityFilters.forEach(filter => {
        if (CLNSIG_TERMS[filter]) {
          validFilters.push(CLNSIG_TERMS[filter]);
        } else {
          console.log('Could not recognize term: ' + filter + ' - ignoring from filtering');
        }
      })
      return 'INFO/CLNSIG="' + validFilters.join(',') + '"';      
    } else {
      return null;
    }

  }


  
  exports.promiseGetVariants = function(refName, geneObject, selectedTranscript, regions, 
    isMultiSample, samplesToRetrieve, getDetailedAnnots=false) {
    var me = this;

    return new Promise( function(resolve, reject) {

      // This comma separated string of samples to perform vcf subset on
      var vcfSampleNames = samplesToRetrieve.filter(function(sample) {
        return (sample.vcfSampleName !== "" && sample.vcfSampleName != null);
      })
      .map(function(sample) {
        return sample.vcfSampleName;
      })
      .join(",");

      // This comma separated string of samples to be contained in the maps of genotypes
      var sampleNamesToGenotype = samplesToRetrieve.map(function(sample) {
        return sample.sampleName;
      })
      .join(",");

      me._promiseGetVariantsImpl(refName, geneObject, selectedTranscript, 
        regions, isMultiSample, vcfSampleNames, sampleNamesToGenotype, 
        getDetailedAnnots)
      .then(function(data) {
        if (data && data.annotatedRecs != null && data.results) {
          resolve(data);
        } else {
          reject("Empty results returned when annotating variants");
        }
      })
      .catch(function(error) {
        return(error)
      })

    });
  }




  exports._promiseGetVariantsImpl = function(refName, geneObject, selectedTranscript, 
    regions, isMultiSample, vcfSampleNames, sampleNamesToGenotype, getDetailedAnnots) {

    var me = this;

    return new Promise(function(resolve, reject) {
      if (regions == null || regions.length == 0) {
        regions = [];
        regions.push({'name': refName, 'start': geneObject.start, 'end': geneObject.end});
      }

      me.getEndpoint().promiseAnnotateVariants(vcfURL, tbiUrl, 
        refName, regions, vcfSampleNames, getDetailedAnnots)
      .then(function(annotatedRecs) {

        let vcfObjects = [];
        annotatedRecs.forEach(function(record) {
          if (record.charAt(0) == "#") {
            me._parseHeaderForInfoFields(record);

          } else {

            // Parse the vcf record into its fields
            var fields = record.split('\t');
            if (fields.length >= 10) {
              var pos    = fields[1];
              var id     = fields[2];
              var ref    = fields[3];
              var alt    = fields[4];
              var qual   = fields[5];
              var filter = fields[6];
              var info   = fields[7];
              var format = fields[8];
              var genotypes = [];

              for (var i = 9; i < fields.length; i++) {
                genotypes.push(fields[i]);
              }
              // Turn vcf record into a JSON object and add it to an array
              var vcfObject = {'pos': pos, 'id': id, 'ref': ref, 'alt': alt,
                               'qual': qual, 'filter': filter, 'info': info, 'format':format, 'genotypes': genotypes};
              vcfObjects.push(vcfObject);

            }
          }
        });


        // Parse the vcf object into a variant object that is visualized by the client.
        var results = me._parseVcfRecords(vcfObjects, refName, geneObject, selectedTranscript, {}, 
                                          getDetailedAnnots, isMultiSample, sampleNamesToGenotype, 
                                          null, false, false, false);


        resolve({'annotatedRecs': annotatedRecs, 'results': results});

      })
      .catch(function(error) {  
        reject(error);
      })
    })

  }



  exports._getExonRegions = function(transcript) {

    return transcript.features
      .filter( function(feature) {
        return feature.feature_type.toUpperCase() == 'CDS' || feature.feature_type.toUpperCase() == 'UTR';
      })
      .sort( function(exon1, exon2) {
        if (exon1.start < exon2.start) {
          return -1;
        } else if (exon1.start > exon2.start) {
          return 1;
        } else {
          return 0;
        }
      })
      .map( function(exon) {
        return {start: exon.start, end: exon.end};
      })
  }



  exports.clearVepInfoFields = function() {
    this.infoFields.VEP = null;
  }

  exports._parseHeaderForInfoFields = function(record) {
    var me = this;
    if (me.infoFields == null) {
      me.infoFields = {};
    }
    if (record.indexOf("INFO=<ID=CSQ") > 0) {
      var fieldMap = me._parseInfoHeaderRecord(record);
      me.infoFields.VEP = fieldMap;
    } else if (record.indexOf("INFO=<ID=AVIA3") > 0 && !me.infoFields.AVIA3) {
      var fieldMap = me._parseInfoHeaderRecord(record);
      me.infoFields.AVIA3 = fieldMap;
    }
    else if (record.indexOf("##INFO") == 0 && !record.startsWith("##INFO=CSQ")) {
      var infoDict = me._parseHeaderForInfoORFormat(record);
      if (infoDict) {
        if (!me.infoFields.INFO) {
          me.infoFields.INFO = {}; // Initialize INFO
        }
        me.infoFields.INFO[infoDict.Id] = infoDict.Description;        
      }
    } else if (record.indexOf("##FORMAT") == 0) {
      var formatDict = me._parseHeaderForInfoORFormat(record);
      if (formatDict) {
        if (!me.infoFields.FORMAT) {
          me.infoFields.FORMAT = {}; // Initialize FORMAT
        }
        me.infoFields.FORMAT[formatDict.Id] = formatDict.Description;        
      }
    }
  }

  exports._parseInfoHeaderRecord = function(record) {
    var fieldMap = {};
    var tokens = record.split("Format: ");
    if (tokens.length == 2) {
      var format = tokens[1];
      if (endsWith(format, '">')) {
        format  =  format.substring(0, format.length - 2 );
      }
      var fields = format.split("|");
      for(var idx = 0; idx < fields.length; idx++) {
        var fieldName = fields[idx];
        if (fieldName.indexOf("\"") == fieldName.length-1) {
          fieldName = fieldName.trim("\"");
        }
        fieldMap[fieldName] = idx;
      }
    }
    return fieldMap;
  }

  exports._parseHeaderForInfoORFormat = function(record) {
    const matches = record.match(/<ID=(\w+),Number=(\w+|\.),Type=(\w+),Description="([^"]+)">/);
    if (matches) {
      const Id = matches[1];
      const Type = matches[3];
      const Description = matches[4].replace(/\([^)]*\)/g, '').trim();
      // infoOrFormat[Id] = { Type: Type, Description: Description, Check: false };
      infoOrFormat = {Id: Id, Description: Description };
    } else {
      console.log("Bypassing vcf annotation " + record + ". Unable to parse.");
      infoOrFormat = null;
    }
    return infoOrFormat;
  }



  exports.promiseGetSampleNames = function() {
    var me = this;

    return new Promise(function(resolve, reject) {
    var cmd = me.getEndpoint().getVcfHeader(vcfURL, tbiUrl);


      var headerData = "";
      // Use Results
      cmd.on('data', function(data) {
           if (data == undefined) {
              return;
           }
           headerData += data;
      });

      cmd.on('end', function(data) {
          var headerRecords = headerData.split("\n");
           headerRecords.forEach(function(headerRec) {
                if (headerRec.indexOf("#CHROM") == 0) {
                  var headerFields = headerRec.split("\t");
                  var sampleNames = headerFields.slice(9);
                  resolve(sampleNames);
                }
           });

      });


      cmd.on('error', function(error) {
        let msg = "Error obtaining vcf header for file. Make sure your vcf file is properly formatted, and that the provided URL is accessible. " + error;
        console.log(msg)
        console.log(error);
        reject(msg)   
      });

      cmd.run();

    })


  }

  exports.parseVcfRecordsForASample = function(annotatedRecs, refName, geneObject, selectedTranscript, clinvarMap, hasExtraAnnot, sampleNamesToGenotype, sampleIndex, vepAF, gnomADExtra) {
    var me = this;

      // For each vcf records, call snpEff to get the annotations.
      // Each vcf record returned will have an EFF field in the
      // info field.
      var vcfObjects = [];

      annotatedRecs.forEach(function(record) {
        if (record == null || record == "") {

        } else if (record.charAt(0) == "#") {
          me._parseHeaderForInfoFields(record);
        } else {

          // Parse the vcf record into its fields
          var fields = record.split('\t');
          var pos    = fields[1];
          var id     = fields[2];
          var ref    = fields[3];
          var alt    = fields[4];
          var qual   = fields[5];
          var filter = fields[6];
          var info   = fields[7];
          var format = fields[8];
          var genotypes = [];
          for (var i = 9; i < fields.length; i++) {
            genotypes.push(fields[i]);
          }


          // Turn vcf record into a JSON object and add it to an array
          var vcfObject = {gene: geneObject, 'pos': pos, 'id': 'id', 'ref': ref, 'alt': alt,
                           'qual': qual, 'filter': filter, 'info': info, 'format': format, 'genotypes': genotypes};
          vcfObjects.push(vcfObject);
        }
      });


      // Parse the vcf object into a variant object that is visualized by the client.
      var results = me._parseVcfRecords(vcfObjects, refName, geneObject, selectedTranscript, {}, hasExtraAnnot, false, sampleNamesToGenotype, sampleIndex, vepAF, false, gnomADExtra);
      return {'annotatedRecs': annotatedRecs, 'results': results};

  }

  exports._promiseAnnotateVcfRecords = function(records, refName, geneObject, selectedTranscript, clinvarMap, hasExtraAnnot, isMultiSample, vcfSampleNames, sampleNamesToGenotype, annotationEngine, isRefSeq, hgvsNotation, getRsId, vepAF, useServerCache, gnomADExtra, decompose) {
    var me = this;

    return new Promise( function(resolve, reject) {
      // For each vcf records, call snpEff to get the annotations.
      // Each vcf record returned will have an EFF field in the
      // info field.
      me._annotateVcfRegion(records, refName, vcfSampleNames, annotationEngine, isRefSeq, hgvsNotation, getRsId, vepAF, useServerCache, gnomADExtra, decompose, function(annotatedData) {

        var annotatedRecs = annotatedData.split("\n");
        var vcfObjects = [];

        annotatedRecs.forEach(function(record) {
          if (record.charAt(0) == "#") {
              me._parseHeaderForInfoFields(record);
          } else {

            // Parse the vcf record into its fields
            var fields = record.split('\t');
            var pos    = fields[1];
            var id     = fields[2];
            var ref    = fields[3];
            var alt    = fields[4];
            var qual   = fields[5];
            var filter = fields[6];
            var info   = fields[7];
            var format = fields[8];
            var genotypes = [];
            for (var i = 9; i < fields.length; i++) {
              genotypes.push(fields[i]);
            }


            // Turn vcf record into a JSON object and add it to an array
            var vcfObject = {'pos': pos, 'id': 'id', 'ref': ref, 'alt': alt,
                             'qual': qual, 'filter': filter, 'info': info, 'format': format, 'genotypes': genotypes};
            vcfObjects.push(vcfObject);
          }
        });

        // Parse the vcf object into a variant object that is visualized by the client.
        var results = me._parseVcfRecords(vcfObjects, refName, geneObject, selectedTranscript, clinvarMap, hasExtraAnnot, isMultiSample, sampleNamesToGenotype, null, vepAF, gnomADExtra);
        resolve([annotatedRecs, results]);
      });
    });
  }


  exports._annotateVcfRegion = function(records, refName, sampleName, annotationEngine, isRefSeq, hgvsNotation, getRsId, vepAF, useServerCache, gnomADExtra, decompose, callback, callbackClinvar ) {
    var me = this;

    //  Figure out the reference sequence file path
    var refFastaFile = me.getGenomeBuildHelper().getFastaPath(refName);


    var writeStream = function(stream) {
      records.forEach( function(record) {
        if (record.trim() == "") {
        } else {
          stream.write(record + "\n");
        }
      });

      stream.end();
    }

    let gnomadURL = null;
    let gnomadRegion = null;
    if (gnomADExtra) {

    }

    var cmd = me.getEndpoint().annotateVariants({'writeStream': writeStream}, refName, regions, null, annotationEngine, isRefSeq, hgvsNotation, getRsId, vepAF, useServerCache, null, false, gnomADExtra, decompose);


    var buffer = "";
    // Get the results from the command
    cmd.on('data', function(data) {
         buffer = buffer + data;
    });

    cmd.on('end', function() {
         callback(buffer);
    });

    cmd.on('error', function(error) {
      console.log("error while annotating vcf records " + error);
    });

    // Run the iobio command
    cmd.run();

  }



  exports._parseVcfRecords = function(vcfRecs, refName, geneObject, selectedTranscript, clinvarMap, hasExtraAnnot, parseMultiSample, sampleNames, sampleIndex, vepAF, sfariMode = false, gnomADExtra = false) {

      var me = this;
      var selectedTranscriptID = globalApp.utility.stripTranscriptPrefix(selectedTranscript.transcript_id);

      // Use the sample index to grab the right genotype column from the vcf record
      // If it isn't provided, assume that the first genotype column is the one
      // to be evaluated and parsed.  If sampleNames (a comma separated value string) is
      // provided, evaluate the sample indices as ordinals since vt select will return only those
      // sample (genotype) columns.
      var gtSampleIndices = [];
      var gtSampleNames = null;

      if (sampleNames != null && sampleNames != "") {
        gtSampleNames   = globalApp.utility.uniq(sampleNames.split(","))
        gtSampleIndices = gtSampleNames.map(function(sampleName,i) {
          return i;
        });
      }
      // If no sample name provided, get the genotype for the provided
      // index.  If no index provided, get the first genotype.
      if (gtSampleIndices.length == 0) {
        gtSampleIndices.push(sampleIndex != null ? sampleIndex : 0);
      }
      if (gtSampleNames == null) {
        gtSampleNames = gtSampleIndices.map(function(elem, i) {
          return elem.toString();
        })
      }
      var allVariants = null;
      if (parseMultiSample) {
        allVariants = gtSampleIndices.map(function(element) {
          return [];
        })
      } else {
        allVariants = [ [] ];
      }


      // The variant region may span more than the specified region.
      // We will be keeping track of variant depth by relative position
      // of the region start, so to prevent a negative index, we will
      // keep track of the region start based on the variants.
      var variantRegionStart = geneObject.start;

      // Iterate through the vcf records.  For each record, if multiple
      // alternates are provided, iterate through each alternate
      vcfRecs.forEach(function(rec) {
        if (rec.pos && rec.id) {
          var alts = [];
          if(rec.alt.indexOf(',') > -1) {
            alts = rec.alt.split(",");
          } else {
            alts.push(rec.alt);
          }
          var altIdx = 0;
          alts.forEach(function(alt) {
            var len = null;
            var type = null;
            var end = null;

            var isMultiAllelic = alts.length > 1;

            if (alt.indexOf("<") == 0 && alt.indexOf(">") > 0) {
              var annotTokens = rec.info.split(";");
              annotTokens.forEach(function(annotToken) {
                if (annotToken.indexOf("SVLEN=") == 0) {
                  len = Math.abs(+annotToken.substring(6, annotToken.length));
                } else if (annotToken.indexOf("SVTYPE=") == 0) {
                  type = annotToken.substring(7, annotToken.length);
                  //if (type && type.toLowerCase() == 'mnp') {
                  //  type = 'snp';
                  //}
                }
              });
              rec.ref = '';
              alt = '';
              end = +rec.pos + len;

            } else {
              len = alt.length;
              type = 'SNP';
              if (rec.ref == '.' || alt.length > rec.ref.length ) {
                type = 'INS';
                len = alt.length - rec.ref.length;
              } else if (rec.alt == '.' || alt.length < rec.ref.length) {
                type = 'DEL';
                len = rec.ref.length - alt.length;
              }
              end = +rec.pos + len;

            }


            var annot = me._parseAnnot(rec, altIdx, isMultiAllelic, geneObject, selectedTranscript, selectedTranscriptID, vepAF, gnomADExtra);

            var gtResult = me._parseGenotypes(rec, alt, altIdx, gtSampleIndices, gtSampleNames, sfariMode);

            if (gtResult.keep) {

              var highestImpactVep    = me._getHighestImpact(annot.vep.allVep,       me._cullTranscripts, selectedTranscriptID);
              var highestREVEL        = me._getHighestScore( annot.vep.allREVEL,     me._cullTranscripts, selectedTranscriptID);

              for (var i = 0; i < allVariants.length; i++) {
                // When vcf data is cached, any circular references are ommitted during JSON.stringify.
                // To avoid culling out this genotype element from the 'genotypes' field, we
                // must make the genotype unique.  Here we are copying the element and adding a dummy
                // attribute
                var genotype = $.extend({'extraAttr': 1}, gtResult.genotypes[i]);

                // Keep the variant if we are just parsing a single sample (parseMultiSample=false)
                // or we are parsing multiple samples and this sample's genotype is het or hom
                if (!parseMultiSample || genotype.keep) {
                  let currId = rec.id;

                  var variant = null;
                  if (hasExtraAnnot) {
                    variant = {
                      'start':                    +rec.pos,
                      'end':                      +end,
                      'len':                      +len,
                      'level':                    +0,
                      'strand':                   geneObject.strand,
                      'chrom':                    refName,
                      'type':                     annot.typeAnnotated && annot.typeAnnotated != '' ? annot.typeAnnotated : type,
                      'id':                       currId,
                      'ref':                      rec.ref,
                      'alt':                      alt,
                      'qual':                     rec.qual,
                      'recfilter':                rec.filter.split(";").join("-"),

                      'extraAnnot':               hasExtraAnnot,

                      'gene':                     geneObject,

                      // genotype fields
                      'genotype':                 genotype,
                      'genotypeDepth' :           genotype.genotypeDepth,
                      'genotypeFilteredDepth' :   genotype.filteredDepth,
                      'genotypeAltCount' :        genotype.altCount,
                      'genotypeRefCount' :        genotype.refCount,
                      'genotypeAltForwardCount' : genotype.altForwardCount,
                      'genotypeAltReverseCount' : genotype.altReverseCount,
                      'genotypeRefForwardCount' : genotype.refForwardCount,
                      'genotypeRefReverseCount' : genotype.refReverseCount,
                      'eduGenotype' :             genotype.eduGenotype,
                      'eduGenotypeReversed':      genotype.eduGenotypeReversed,
                      'zygosity':                 genotype.zygosity ? genotype.zygosity : 'gt_unknown',
                      'phased':                   genotype.phased,

                      // fields to init to 'empty'
                      'consensus':                rec.consensus,
                      'inheritance':              '',

                      //
                      // annot fields
                      //
                      'rsid' :                    annot.rs,
                      'combinedDepth':            annot.combinedDepth,


                      // multi-allelic (from vt decompose)
                      'multiallelic':             annot.multiallelic,

                      // vep
                      'vepConsequence':          annot.vep.vepConsequence,
                      'vepImpact':               annot.vep.vepImpact,
                      'vepExon':                 annot.vep.vepExon,
                      'vepHGVSc':                annot.vep.vepHGVSc,
                      'vepHGVSp':                annot.vep.vepHGVSp,
                      'vepAminoAcids':           annot.vep.vepAminoAcids,
                      'vepProteinPosition':      annot.vep.vepProteinPosition,
                      'vepVariationIds' :        annot.vep.vepVariationIds,
                      'vepREVEL':                annot.vep.vepREVEL,

                      // gnomAD
                      'gnomAD':                  annot.gnomAD,


                      // generic annots
                      'genericAnnots':           annot.genericAnnots,

                      // all annots values
                      'allAnnots':               annot.allAnnots,

                      // format values
                      'formatMap':               annot.formatMap,

                      //  when multiple impacts, pick the highest one (by variant type and transcript)
                      'highestImpactVep':        highestImpactVep,
                      'highestREVEL':            highestREVEL
                    }
                  } else {
                    variant = {
                      'start':                    +rec.pos,
                      'end':                      +end,
                      'len':                      +len,
                      'level':                    +0,
                      'strand':                   geneObject.strand,
                      'chrom':                    refName,
                      'type':                     annot.typeAnnotated && annot.typeAnnotated != '' ? annot.typeAnnotated : type,
                      'id':                       currId,
                      'ref':                      rec.ref,
                      'alt':                      alt,
                      'qual':                     rec.qual,
                      'recfilter':                rec.filter.split(";").join("-"),

                      'extraAnnot':               hasExtraAnnot,

                      'gene':                     geneObject,

                      // genotype fields
                      'genotype':                 genotype,
                      'genotypeDepth' :           genotype.genotypeDepth,
                      'genotypeFilteredDepth' :   genotype.filteredDepth,
                      'genotypeAltCount' :        genotype.altCount,
                      'genotypeRefCount' :        genotype.refCount,
                      'genotypeAltForwardCount' : genotype.altForwardCount,
                      'genotypeAltReverseCount' : genotype.altReverseCount,
                      'genotypeRefForwardCount' : genotype.refForwardCount,
                      'genotypeRefReverseCount' : genotype.refReverseCount,
                      'zygosity':                 genotype.zygosity ? genotype.zygosity : 'gt_unknown',
                      'phased':                   genotype.phased,

                      // fields to init to 'empty'
                      'consensus':                rec.consensus,
                      'inheritance':              '',

                      //
                      // annot fields
                      //
                      //'rsid' :                    annot.rs,
                      'combinedDepth':            annot.combinedDepth,


                      // multi-allelic (from vt decompose)
                      'multiallelic':             annot.multiallelic,

                      // vep
                      'vepConsequence':          annot.vep.vepConsequence,
                      'vepImpact':               annot.vep.vepImpact,
                      'vepExon':                 annot.vep.vepExon,
                      'vepAminoAcids':           annot.vep.vepAminoAcids,
                      'vepProteinPosition':      annot.vep.vepProteinPosition,
                      'vepVariationIds' :        annot.vep.vepVariationIds,
                      'vepREVEL':                annot.vep.vepREVEL,

                      // gnomAD
                      'gnomAD':                  gnomADExtra ? annot.gnomAD : null,

                      // all annots values
                      'allAnnots':               annot.allAnnots,

                      // format values
                      'formatMap':               annot.formatMap,

                      //  when multiple impacts, pick the highest one (by variant type and transcript)
                      'highestImpactVep':        highestImpactVep,
                      'highestREVEL':            highestREVEL
                    }                    
                  }


                  if (hasExtraAnnot && me.getGenericAnnotation() !== undefined && sfariMode === false) {
                    me.getGenericAnnotation().setSimpleFields(variant);
                  }

                  allVariants[i].push(variant);
                }

              }

              if (rec.pos < variantRegionStart) {
                variantRegionStart = rec.pos;
              }

            }

            altIdx++;

          });
        }

      });

      // Here is the result set.  An object representing the entire region with a field called
      // 'features' that contains an array of variants for this region of interest.
      var results = [];
      for (var i = 0; i < allVariants.length; i++) {
        var data = {
          'name':              'vcf track',
          'ref':                refName,
          'gene':               geneObject.gene_name,
          'start':              +geneObject.start,
          'end':                +geneObject.end,
          'strand':             geneObject.strand,
          'transcript':         selectedTranscript,
          'variantRegionStart': variantRegionStart,
          'loadState':          {},
          'features':           allVariants[i],
          'genericAnnotators':  me.infoFields ? Object.keys(me.infoFields) : []
        };
        results.push(data);
      }

      return  parseMultiSample ? results :  results[0];
      //return  results;
  };

exports._parseAnnot = function(rec, altIdx, isMultiAllelic, geneObject, selectedTranscript, selectedTranscriptID, vepAF, gnomADExtra=false) {
  var me = this;

  var annot = {
    af: null,
    typeAnnotated: null,
    combinedDepth: null,
    af1000G: '.',
    afExAC: '.',
    rs: '',
    multiallelic: '',
    snpEff: {
      effects: {},
      impacts: {},
      allSnpeff: {}
    },

    allAnnots: {},
    formatMap : {},

    gnomAD: gnomADExtra ? {
      af: '.',
      afPopMax: '.',
      altCount: 0,
      totalCount: 0,
      homCount: 0,
      pop: {
        fin: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        nfe: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        oth: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        amr: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        afr: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        asj: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        eas: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        },
        sas: {
          af: '.',
          altCount: 0,
          totalCount: 0,
        }

      }
    } : null,

    vep: {
      allVep: {},
      allSIFT: {},
      allPolyphen: {},
      allREVEL: {},
      vepConsequence: {},
      vepImpact: {},
      vepFeatureType: {},
      vepFeature: {},
      vepExon: {},
      vepHGVSc: {},
      vepHGVSp: {},
      vepAminoAcids: {},
      vepProteinPosition: {},
      vepVariationIds: {},
      vepSIFT: {},
      vepPolyPhen: {},
      vepREVEL: {},
      sift: {},       // need a special field for filtering purposes
      polyphen: {},   // need a special field for filtering purposes
      regulatory: {}, // need a special field for filtering purposes
      vepRegs: [],
      af: {'1000G': {}, 
           'ESP': {}, 
           'gnomAD': {}, 
           'MAX': {}, 
           'gnomADg': (globalApp.gnomADExtraMethod == globalApp.GNOMAD_METHOD_CUSTOM_VEP ? {} : null), 
           'gnomADe': (globalApp.gnomADExtraMethod == globalApp.GNOMAD_METHOD_CUSTOM_VEP ? {} : null)
     }
    },
    genericAnnots:  {}
  };

  var annotTokens = [];
  if (rec.info) {
    annotTokens = rec.info.split(";");
  }

  var formatTokens = [];
  if (rec.format) {
    formatTokens = rec.format.split(":");
  }
  var formatValues = [];
  if (rec.genotypes && altIdx < rec.genotypes.length) {
    formatValues = rec.genotypes[altIdx].split(":");
  }

  formatTokens.forEach(function(token, i) {
    annot.formatMap[token] = formatValues[i];
  });

  if (gnomADExtra) {
    me._parseGnomADAnnot(annotTokens, annot);
  }

  annotTokens.forEach(function(annotToken) {
    let equalIdx = annotToken.indexOf('=');
    annot.allAnnots[annotToken.substring(0,equalIdx)] = annotToken.substring(equalIdx+1, annotToken.length)

    if (annotToken.indexOf("BGAF_1KG=") == 0) {

      annot.af1000G = annotToken.substring(9, annotToken.length);

    } else if (annotToken.indexOf("BGAF_EXAC=") == 0) {

      annot.afExAC = annotToken.substring(10, annotToken.length);

    } else if (annotToken.indexOf("RS=") == 0) {

      annot.rs = annotToken.substring(3, annotToken.length);

    } else if (annotToken.indexOf("AF=") == 0) {

      // For now, just grab first af
      //af = me._parseAnnotForAlt(annotToken.substring(3, annotToken.length), altIdx);
      annot.af = me._parseAnnotForAlt(annotToken.substring(3, annotToken.length), 0);

    } else if (annotToken.indexOf("TYPE=") == 0) {

      annot.typeAnnotated = me._parseAnnotForAlt(annotToken.substring(5, annotToken.length), altIdx);

    } else if (annotToken.indexOf("DP=") == 0) {

      annot.combinedDepth = annotToken.substring(3, annotToken.length);

    } else if (annotToken.indexOf("EFF=") == 0) {

      me._parseSnpEffAnnot(annotToken, annot, geneObject, selectedTranscriptID);

    } else if (annotToken.indexOf("CSQ") == 0) {

      me._parseVepAnnot(altIdx, isMultiAllelic, annotToken, annot, geneObject, selectedTranscript, selectedTranscriptID, vepAF, gnomADExtra)

    } else if (annotToken.indexOf("AVIA3") == 0) {
      me._parseGenericAnnot("AVIA3", annotToken, annot);

    } else if (annotToken.indexOf("OLD_MULTIALLELIC=") == 0) {
      annot.multiallelic = annotToken.substring(17, annotToken.length);
    }

  });


  return annot;
}
/* To parse the VEP annot, split the CSQ string into its parts.
   Each part represents the annotations for a given transcript.

  Here is the field mapping for each transcript
  which is separated by a comma

   Allele|Consequence|IMPACT|SYMBOL|Gene|Feature_type|Feature|BIOTYPE|EXON|INTRON|HGVSc|HGVSp
   |cDNA_position|CDS_position|Protein_position|Amino_acids|Codons|Existing_variation
   |DISTANCE|STRAND|FLAGS|SYMBOL_SOURCE|HGNC_ID|GENE_PHENO|SIFT|PolyPhen|HGVS_OFFSET
   |AFR_AF|AMR_AF|EAS_AF|EUR_AF|SAS_AF
   |AA_AF|EA_AF
   |gnomAD_AF|gnomAD_AFR_AF|gnomAD_AMR_AF|gnomAD_ASJ_AF|gnomAD_EAS_AF|gnomAD_FIN_AF|gnomAD_NFE_AF|gnomAD_OTH_AF|gnomAD_SAS_AF
   |MAX_AF|MAX_AF_POPS
   |CLIN_SIG|SOMATIC|PHENO|MOTIF_NAME|MOTIF_POS|HIGH_INF_POS|MOTIF_SCORE_CHANGE


*/
exports._parseVepAnnot = function(altIdx, isMultiAllelic, annotToken, annot, geneObject, selectedTranscript, selectedTranscriptID, vepAF, gnomADExtra) {
  var me = this;

  var vepFields = me.infoFields.VEP;

  var tokenValue = annotToken.substring(4, annotToken.length);
  var transcriptTokens = tokenValue.split(",");

  transcriptTokens.forEach(function(transcriptToken) {
      var vepTokens   = transcriptToken.split("|");

      var keep = true;
      if (isMultiAllelic) {
        if (vepFields.hasOwnProperty('ALLELE_NUM') && vepFields.ALLELE_NUM >= 0) {
          var vepAlleleNumber   = vepTokens[vepFields.ALLELE_NUM];
          if (altIdx >= 0 &&  vepAlleleNumber >= 0) {
            if (altIdx+1 != vepAlleleNumber) {
              keep = false;
            }
          }
        }
      }

      if (keep) {
        var feature     = vepTokens[vepFields.Feature];
        var featureType = vepTokens[vepFields.Feature_type];

        // If the transcript is the selected transcript, parse
        // all of the vep fields.  We place these into maps
        // because we can have multiple vep consequences for
        // the same transcript.
        // TODO:  Need to sort so that highest impact shows first
        //        and is used for filtering and ranking purposes.
        if (featureType == 'Transcript' && 
          (feature == selectedTranscriptID 
            || feature == selectedTranscript.transcript_id
            // For now, RefSeq transcripts may not match last digit after '.'.
            // For example, GRCh37 transcript from geneinfo for RAI1 
            // is NM_030665.3 (a previous patch release)
            // and VEP shows the transcript NM_030665.4 for GRCh37.p13
            || feature.indexOf(selectedTranscriptID) == 0)) {
          annot.vep.vepImpact[vepTokens[vepFields.IMPACT]] = vepTokens[vepFields.IMPACT];

          var consequence = vepTokens[vepFields.Consequence];
          consequence.split("&").forEach( function(token) {
            annot.vep.vepConsequence[token] = token;
          })

          if (vepTokens[vepFields.EXON] && vepTokens[vepFields.EXON].length > 0) {
            annot.vep.vepExon[vepTokens[vepFields.EXON]] = vepTokens[vepFields.EXON];
          }
          annot.vep.vepHGVSc[vepTokens[vepFields.HGVSc]] = vepTokens[vepFields.HGVSc];
          annot.vep.vepHGVSp[vepTokens[vepFields.HGVSp]] = vepTokens[vepFields.HGVSp];
          annot.vep.vepAminoAcids[vepTokens[vepFields.Amino_acids]] = vepTokens[vepFields.Amino_acids];
          annot.vep.vepProteinPosition[vepTokens[vepFields.Protein_position]] = vepTokens[vepFields.Protein_position];
          annot.vep.vepVariationIds[vepTokens[vepFields.Existing_variation]] = vepTokens[vepFields.Existing_variation];

          var siftString = vepTokens[vepFields.SIFT];
          var siftDisplay = siftString != null && siftString != "" ? siftString.split("(")[0] : "";
          annot.vep.vepSIFT[siftDisplay] = siftDisplay;
          annot.vep.sift['sift_'+ siftDisplay] = 'sift_' + siftDisplay;

          var polyphenString = vepTokens[vepFields.PolyPhen];
          var polyphenDisplay = polyphenString != null && polyphenString != "" ? polyphenString.split("(")[0] : "";
          annot.vep.vepPolyPhen[polyphenDisplay] = polyphenDisplay;
          annot.vep.polyphen['polyphen_' + polyphenDisplay] = 'polyphen_' + polyphenDisplay;

          if (vepFields.REVEL) {
            var revelScore = vepTokens[vepFields.REVEL];
            annot.vep.vepREVEL[revelScore] = revelScore;
          }


        } else if (featureType == 'RegulatoryFeature' || featureType == 'MotifFeature' ) {
          annot.vep.vepRegs.push( {
            'impact' :  vepTokens[vepFields.IMPACT],
            'consequence' : vepTokens[vepFields.Consequence],
            'biotype': vepTokens[vepFields.BIOTYPE],
            'motifName' : vepTokens[vepFields.MOTIF_NAME],
            'motifPos'  : vepTokens[vepFields.MOTIF_POS],
            'motifHiInf' : vepTokens[vepFields.HIGH_INF_POS]
          });
          var reg = vepTokens[vepFields.Consequence] == 'regulatory_region_variant' ? vepTokens[vepFields.BIOTYPE] : vepTokens[vepFields.Consequence];
          var regKey = reg;
          if (reg == "promoter") {
            regKey = "the_promoter";
          }

          var valueUrl = "";
          if (feature != "" && feature != null) {
            var url = me.getGenomeBuildHelper().getBuildResource(me.getGenomeBuildHelper().RESOURCE_ENSEMBL_URL) + "Regulation/Context?db=core;fdb=funcgen;rf=" + feature;
            valueUrl = '<a href="' + url + '" target="_reg">' + reg.split("_").join(" ").toLowerCase() + '</a>';
          } else {
            valueUrl = reg.split("_").join(" ").toLowerCase();
          }
          annot.vep.regulatory[(featureType == 'RegulatoryFeature' ? "reg_" : "mot_") + regKey.toLowerCase()] = valueUrl;
        }
        if (featureType == 'Transcript') {
          var theTranscriptId = feature;

          // Only keep annotations that are for transcripts that in the gene's list of known
          // transcripts
          var validTranscript = false;
          geneObject.transcripts.forEach( function(transcript) {
          if (transcript.transcript_id.indexOf(theTranscriptId) == 0) {
            validTranscript = true;
            }
          });
          if (validTranscript) {
            // Keep track of all VEP impact and consequence so that we can determine the highest impact
            // variant across all transcripts
            var theImpact = vepTokens[vepFields.IMPACT];
            var theConsequences = vepTokens[vepFields.Consequence];
            var siftString = vepTokens[vepFields.SIFT];
            var siftDisplay = siftString != null && siftString != "" ? siftString.split("(")[0] : "";
            var siftScore = "99";
            if (siftString != null && siftString != "" && siftString.indexOf("(") >= 0) {
              siftScore = siftString.split("(")[1].split(")")[0];
            }
            var polyphenString = vepTokens[vepFields.PolyPhen];
            var polyphenDisplay = polyphenString != null && polyphenString != "" ? polyphenString.split("(")[0] : "";
            var polyphenScore = -99;
            if (polyphenString != null && polyphenString != "" && polyphenString.indexOf("(") >= 0) {
              polyphenScore = polyphenString.split("(")[1].split(")")[0];
            }

            var revelScore  = vepFields.REVEL ? vepTokens[vepFields.REVEL] : "";

            var consequencesObject = annot.vep.allVep[theImpact];
            if (consequencesObject == null) {
              consequencesObject = {};
            }

            me._appendTranscript(consequencesObject, theConsequences, theTranscriptId);
            annot.vep.allVep[theImpact] = consequencesObject;

            var siftObject = annot.vep.allSIFT[siftScore];
            if (siftObject == null) {
              siftObject = {};
            }
            me._appendTranscript(siftObject, siftDisplay, theTranscriptId);
            annot.vep.allSIFT[siftScore] = siftObject;

            var polyphenObject = annot.vep.allPolyphen[polyphenScore];
            if (polyphenObject == null) {
              polyphenObject = {};
            }
            me._appendTranscript(polyphenObject, polyphenDisplay, theTranscriptId);
            annot.vep.allPolyphen[polyphenScore] = polyphenObject;

            var revelObject = annot.vep.allREVEL[revelScore];
            if (revelObject == null) {
              revelObject = {};
            }
            me._appendTranscript(revelObject, revelScore, theTranscriptId);
            annot.vep.allREVEL[revelScore] = revelObject;


            if (vepAF) {
              me._parseVepAfAnnot(VEP_FIELDS_AF_GNOMAD, vepFields, vepTokens, "gnomAD", "gnomAD", annot);
              //me._parseVepAfAnnot(VEP_FIELDS_AF_1000G,  vepFields, vepTokens, "1000G",  null,     annot);
              //me._parseVepAfAnnot(VEP_FIELDS_AF_ESP,    vepFields, vepTokens, "ESP",    null,     annot);
              me._parseVepAfAnnot(VEP_FIELDS_AF_MAX,    vepFields, vepTokens, "MAX",    "MAX",    annot);
            }
            if (vepAF && gnomADExtra && globalApp.gnomADExtraMethod == globalApp.GNOMAD_METHOD_CUSTOM_VEP ) {
              me._parseVepAfAnnot(VEP_FIELDS_AF_GNOMAD_GENOMES, vepFields, vepTokens, "gnomADg", "gnomADg", annot);
              me._parseVepAfAnnot(VEP_FIELDS_AF_GNOMAD_EXOMES, vepFields, vepTokens, "gnomADe", "gnomADe", annot);
            }

          } else {
            var consequence = vepTokens[vepFields.Consequence];
            //console.log(geneObject.gene_name + " " + consequence + ": throwing out invalid transcript " + theTranscriptId);
          }

        }
      }

  });


}

exports._parseVepAfAnnot = function(fieldNames, vepFields, vepTokens, afSource, omitPrefix, annot) {
  let fieldsPresent = false;
  fieldNames.forEach(function(fieldName) {
    var targetFieldName = omitPrefix ? fieldName.split(omitPrefix + "_")[1] : fieldName;
    var tokenIdx        = vepFields[fieldName];
    if (tokenIdx && vepTokens[tokenIdx]) {
      fieldsPresent  = true;
    }
  })

  fieldNames.forEach(function(fieldName) {
    var targetFieldName = omitPrefix ? fieldName.split(omitPrefix + "_")[1] : fieldName;
    var tokenIdx        = vepFields[fieldName];
    if (tokenIdx && vepTokens[tokenIdx] && vepTokens[tokenIdx].length > 0) {
      annot.vep.af[afSource][targetFieldName] = vepTokens[tokenIdx];
    } else {
      annot.vep.af[afSource][targetFieldName] = ".";
    }
  })    
  annot.vep.af[afSource].present = fieldsPresent;

}

exports._parseGnomADAnnot = function(annotTokens, annot) {

  var me = this;

  var setNestedValue = function(annotObject, gnomADTags, idx, theValue) {
    var field = gnomADTags[idx];
    if (idx == gnomADTags.length - 1) {
      annotObject[field] = theValue;
      return;
    } else {
      idx++;
      setNestedValue(annotObject[field], gnomADTags, idx, theValue)
    }
  }

  annotTokens.forEach(function(annotToken) {
    var tagValue = annotToken.split("\=");
    var annotTag   = tagValue[0];
    var annotValue = tagValue[1];

    var gnomADTag         = GNOMAD_TAGS[genomeBuildHelper.getCurrentBuildName()][annotTag];
    if (gnomADTag && annotValue) {
      if (Array.isArray(gnomADTag)) {
        var idx = 0
        setNestedValue(annot.gnomAD, gnomADTag, idx, annotValue);
      } else {
        annot.gnomAD[gnomADTag] = annotValue;
      }
    }
  })
  if (annot.gnomAD.afPopMax == '.') {
    annot.gnomAD.afPopMax = annot.gnomAD.af;
    Object.keys(annot.gnomAD.pop).forEach(function(popKey) {
      let pop_af = annot.gnomAD.pop[popKey].af;
      if (parseFloat(pop_af) > parseFloat(annot.gnomAD.afPopMax)) {
        annot.gnomAD.afPopMax = pop_af;
      }
    })
  }

}

exports._parseGenericAnnot = function(annotator, annotToken, annot) {
  var me = this;
  var annotObject = {};
  var fieldMap = me.infoFields[annotator];

  var infoValues  = annotToken.substring(annotator.length + 1, annotToken.length);
  var tokens      = infoValues.split("|");
  for (var fieldName in fieldMap) {
    var idx = fieldMap[fieldName];

    var theValue = tokens[idx] ? tokens[idx] : '';
    var valueObject = null;
    if (theValue.indexOf(":") > 0) {
      valueObject = {};
      var subFields = theValue.split(":");
      // for each pair, create a tag/value in the associative array
      for (var x = 0; x < subFields.length - 1; x += 2) {
        var tag = subFields[x];
        var value = subFields[x+1];
        valueObject[tag] = value;
      }
    } else {
      valueObject = theValue;
    }

    annotObject[fieldName] = valueObject;
  }
  annot.genericAnnots[annotator] = annotObject;
}



/*
 *
 * Parse the genotype field from in the vcf rec
 *
 */
 exports._parseGenotypes = function(rec, alt, altIdx, sampleIndices, sampleNames, sfariMode) {
    var me = this;

    // The result returned will be an object representing all
    // genotypes for the sample indices provided.
    //
    //  all      the alternate for which these genotype(s) apply
    //  keep     a boolean indicating if any of the sample genotypes
    //           contains this alternate.  For example, if this is a
    //           multiallelic, if non of the samples contains this
    //           alternate, keep will be set to false.
    //  gtNumber Normally, the gtNumber for an alterate will equal
    //           1.  For multi-allelics, this number ranges from
    //           1 to the number of alternate alleles.
    //
    //
    var result = {
      alt:         alt,
      keep:        false,
      gtNumber:    altIdx +1,
      genotype:    {},
      genotypes:   [],
      genotypeMap: {} };



    // The results will contain an array of genotype objects for
    // each sample index provided.  The first element in the
    // array is assumed to be the "target" genotype.  For example,
    // if we are parsing the genotypes for a trio, the first
    // genotype will be for the proband, followed by 2 more elements
    // for the mother and father's genotypes.
     result.genotypes = sampleIndices.map( function(sampleIndex) {
         return { sampleIndex: sampleIndex, zygosity: null, phased: null};
     });

      // The results will also contain a map to obtain
      // the genotype by sample name.  If sample names were not provided,
      // we will use the index as the key to the map.
      // NOTE: cannot do this for sfari samples, crashes browser
     if (sfariMode === true) {
       result.genotypeMap = {};
     } else {
       result.genotypes.forEach(function(gt) {
           let key = sampleNames ? sampleNames[gt.sampleIndex] : gt.sampleIndex.toString();
           result.genotypeMap[key] = gt;
       });
     }

    // Determine the format of the genotype fields
    var gtTokens = {};
    var idx = 0;
    if (rec.format && rec.format != '') {
      var tokens = rec.format.split(":");
      tokens.forEach(function(token) {
        gtTokens[token] = idx;
        idx++;
      })
    }

    //
    // For each applicable genotype (of the sample indices provided),
    // parse the genotype field of the vcf record, creating an
    // object with the following fields:
    //    sampleIndex         - The applicable genotype column (for a sample)
    //    gt                  - The genotype field (e.g. 0|1)
    //    zygosity            - The zygosity (e.g. het, hom, homref)
    //    depth               - The total observations at this position
    //    filteredDepth       - The total observations considered at this position
    //    altCount            - The number of observations where the alternate allele was observed
    //    refCount            - The number of observations where the reference allele was observed
    //    altForwardCount,    - The alternate counts for the strands
    //    altReverseCount
    //    refForwardCount,    - The reference counts for the strands
    //    refReverseCount
    //    eduGenotype         - The simplified format for showing genotype (e.g. C->T)
    //    eduGenotypeReversed - For reverse strand, show the compliment of the simplified genotype (e.g. A->G)
    //
    result.genotypes.forEach( function(gt) {
      var genotype = rec.genotypes.length > gt.sampleIndex ? rec.genotypes[gt.sampleIndex] : null;

      if (genotype == null  || genotype == "" || genotype == '.') {
        gt.zygosity = 'gt_unknown';
        gt.keep      = rec.genotypes.length == 0 ? true : false;
        gt.absent   =  rec.genotypes.length == 0 ? true : false;
      } else {

        var tokens = genotype.split(":");
        var gtFieldIndex = gtTokens["GT"];
        gt.gt = tokens[gtFieldIndex];

        var gtDepthIndex = gtTokens["DP"];
        if (gtDepthIndex) {
          gt.filteredDepth = tokens[gtDepthIndex];
        } else {
          gt.filteredDepths = null;
        }

        var gtAlleleCountIndex = gtTokens["AD"];
        var gtAltCountIndex = gtTokens["AO"];
        if (gtAlleleCountIndex) {
          //
          // GATK allele counts
          //
          var countTokens = tokens[gtAlleleCountIndex].split(",");
          if (countTokens.length >= 2 ) {
            var refAlleleCount = countTokens[0];
            var altAlleleCounts = countTokens.slice(1).join(",");

            var totalAllelicDepth = 0;
            countTokens.forEach(function(allelicDepth) {
              if (allelicDepth) {
                totalAllelicDepth += +allelicDepth;
              }
            })

            gt.altCount      = altAlleleCounts;
            gt.refCount      = refAlleleCount;
            gt.genotypeDepth = totalAllelicDepth;
          } else {
            gt.altCount      = null;
            gt.refCount      = null;
            gt.genotypeDepth = null;
          }
        } else if (gtAltCountIndex) {
          //
          // Freebayes allele counts
          //
          var totalAllelicDepth = 0;


          gt.altCount = tokens[gtAltCountIndex];

          var altCountTokens = gt.altCount.split(",");
          altCountTokens.forEach(function(allelicDepth) {
            if (allelicDepth) {
                totalAllelicDepth += +allelicDepth;
            }
          })

          var gtRefCountIndex = gtTokens["RO"];
          if (gtRefCountIndex) {
            gt.refCount = tokens[gtRefCountIndex];;
            totalAllelicDepth += +gt.refCount;
          } else {
            gt.refCount = null;
          }

          gt.genotypeDepth = totalAllelicDepth;


        } else {
          gt.altCount = null;
          gt.refCount = null;
        }

        gt.altCount = me._parseMultiAllelic(result.gtNumber-1, gt.altCount, ",");


        var strandAlleleCountIndex = gtTokens["SAC"]; // GATK
        var strandRefForwardIndex  = gtTokens["SRF"]; // Freebayes
        var strandRefReverseIndex  = gtTokens["SRR"]; // Freebayes
        var strandAltForwardIndex  = gtTokens["SAF"]; // Freebayes
        var strandAltReverseIndex  = gtTokens["SAR"]; // Freebayes
        if (strandAlleleCountIndex) {
          //
          // GATK Strand allele counts, comma separated
          //
          var countTokens = tokens[strandAlleleCountIndex].split(",");
          if (countTokens.length == 4) {
            gt.refForwardCount = tokens[0];
            gt.refReverseCount = tokens[1];
            gt.altForwardCount = tokens[2];
            gt.altReverseCount = tokens[3];
          } else {
            gt.refForwardCount = null;
            gt.refReverseCount = null;
            gt.altForwardCount = null;
            gt.altReverseCount = null;
          }
        } else if (strandRefForwardIndex && strandRefReverseIndex && strandAltForwardIndex && strandAltReverseIndex ) {
          //
          // Freebayes Strand bias counts (SRF, SRR, SAF, SAR)
          //
          gt.refForwardCount = tokens[strandRefForwardIndex];
          gt.refReverseCount = tokens[strandRefReverseIndex];
          gt.altForwardCount = tokens[strandAltForwardIndex];
          gt.altReverseCount = tokens[strandAltReverseIndex];
        } else {
          gt.refForwardCount = null;
          gt.refReverseCount = null;
          gt.altForwardCount = null;
          gt.altReverseCount = null;
        }



        // Only keep the alt if we have a genotype that matches.
        // For example
        // A->G    0|1 keep
        // A->G,C  0|1 keep A->G, but bypass A->C
        // A->G,C  0|2 bypass A->G, keep A->C
        // A->G,C  1|2 keep A->G, keep A->C
        // unknown .   bypass
        var delim = null;

        if (gt.gt.indexOf("|") > 0) {
          delim = "|";
          gt.phased = true;
        } else if (gt.gt.indexOf("/") > 0){
          delim = "/";
          gt.phased = false;
        } else if (gt.gt == ".") {
          gt.keep = false;
          gt.zygosity = "HOMREF";
        } else {
          gt.keep = false;
          gt.zygosity = "gt_unknown";
        }
        if (delim) {
          var tokens = gt.gt.split(delim);
          if (tokens.length == 2) {
            if (tokens[0] == result.gtNumber || tokens[1] == result.gtNumber) {
              //  result.gtNumber will be a number > 1 if this is a multi-allelic
              //  in this case, we have a genotype that is not 0 and matches
              //  the "alt"
              //    simple het example:
              //      ref    alt   gt
              //      A      T     0/1
              //    simple hom example:
              //      ref    alt   gt
              //      A      T     1/1
              //    multi-allelic het example:
              //      ref    alt   gt
              //      A      T,G   1/2  if gt.number is "2", that means we will is het for A->G
              //    multi-allelic hom example:
              //      ref    alt   gt
              //      A      T,G   2/2  if gt.number is "2", that means we will is hom for A->G
              gt.keep = true;
              if (tokens[0] == tokens[1]) {
                gt.zygosity = "HOM";
              } else {
                gt.zygosity = "HET";
              }
            }
            else if (tokens[0] == "0" && tokens[1] == "0" ) {
              // Homozygous ref 0/0
              gt.keep = false;
              gt.zygosity = "HOMREF"
            } else if (tokens[0] != result.gtNumber && tokens[1] != result.gtNumber ) {
              // Multi-allelic, but this genotype doesn't have the alternate
              //    multi-allelic  example:
              //      ref    alt   gt
              //      A      T,G   0/1  if gt.number is "2", that means this allele is not present
              gt.keep = false;
              gt.zygosity = "gt_unknown"
            }
          }

        }
      }
    });



    result.genotypes.forEach(function(gt) {
      if (gt.keep) {
        result.keep = true;
      }
    });

    // The 'target' genotype will be the first genotype in the array
    // For example, if the sampleIndex of '1' was sent in (sampleIndices = [1]),
    // the first element in the the array will be the second genotype
    // column in the vcf record (sample index is 0 based).
    if (result.genotypes.length > 0) {
      result.genotype = result.genotypes[0];
    }

    return result;
 }


exports._appendTranscript = function(theObject, key, theTranscriptId) {
  var me = this;
  var transcripts = theObject[key];
  if (transcripts == null) {
    transcripts = {};
  }
  transcripts[theTranscriptId] = theTranscriptId;
  theObject[key] = transcripts;
}


exports._cullTranscripts = function(transcriptObject, theTranscriptId) {
  var me = this;
  // If the current transcript is included in the list,
  // we don't have to identify individual transcripts.
  for (var key in transcriptObject) {
    var transcripts = transcriptObject[key];
    var found = false;
    for (var transcriptId in transcripts) {
      var strippedTranscriptId = globalApp.utility.stripTranscriptPrefix(transcriptId);
      if (theTranscriptId.indexOf(strippedTranscriptId) == 0) {
        found = true;
      }
    }
    if (found) {
      transcriptObject[key] = {};
    }

  }
  return transcriptObject;
}

exports._getHighestImpact = function(theObject, cullFunction, theTranscriptId) {
  var me = this;
  var theEffects = theObject['HIGH'];
  if (theEffects) {
    return {HIGH: cullFunction(theEffects, theTranscriptId)};
  }
  theEffects = theObject['MODERATE'];
  if (theEffects) {
    return {MODERATE: cullFunction(theEffects, theTranscriptId)};
  }
  theEffects = theObject['MODIFIER'];
  if (theEffects) {
    return {MODIFIER: cullFunction(theEffects, theTranscriptId)};
  }
  theEffects = theObject['LOW'];
  if (theEffects) {
    return {LOW: cullFunction(theEffects, theTranscriptId)};
  }
  return {};
}

exports._getLowestScore = function(theObject, cullFunction, theTranscriptId) {
  var me = this;
  var minScore = 99;
  for( var score in theObject) {
    if (+score < minScore) {
      minScore = +score;
    }
  }
  // Now get other entries with the same SIFT/Polyphen category
  var categoryObject = theObject[minScore];
  for (var category in categoryObject) {
    for (var theScore in theObject) {
      var theCategoryObject = theObject[theScore];
      if (+theScore != +minScore && theCategoryObject[category] != null) {
        var theTranscripts = theCategoryObject[category];
        for (var transcriptId in theTranscripts) {
          me._appendTranscript(categoryObject, category, transcriptId);
        }
      }
    }

  }
  theObject[minScore] = cullFunction(categoryObject, theTranscriptId);
  return theObject[minScore];
}

exports._getHighestScore = function(theObject, cullFunction, theTranscriptId) {
  var me = this;
  var maxScore = -99;
  for( var score in theObject) {
    if (+score > maxScore) {
      maxScore = +score;
    }
  }
  // Now get other entries with the same SIFT/Polyphen category
  var categoryObject = theObject[maxScore];
  for (var category in categoryObject) {
    for (var theScore in theObject) {
      var theCategoryObject = theObject[theScore];
      if (+theScore != +maxScore && theCategoryObject[category] != null) {
        var theTranscripts = theCategoryObject[category];
        for (var transcriptId in theTranscripts) {
          me._appendTranscript(categoryObject, category, transcriptId);
        }
      }
    }

  }
  theObject[maxScore] = cullFunction(categoryObject, theTranscriptId);
  return theObject[maxScore];
}

  exports._parseMultiAllelic = function(alleleIdx, genotypeValue, delim) {
    if (genotypeValue == null || genotypeValue == "" || genotypeValue.indexOf(delim) < 0) {
      return genotypeValue;
    } else {
      var tokens = genotypeValue.split(delim);
      if (tokens.length > alleleIdx) {
        return tokens[alleleIdx];
      } else {
        return genotypeValue;
      }
    }
  };

  // If af returned from af is for multi-allelic variants, we need to parse out the
  // correct af from the comma separated string.
  exports._parseAf = function(altIdx, af) {
      // Handle multi-allelics
      if (af.indexOf(",") > 0) {
        var aftokens = af.split(",");
        var theAf = aftokens[+altIdx];
        return theAf;
      } else {
        return af;
      }
  };


  exports._parseAnnotForAlt = function(value, altIdx) {
    var annotValue = "";
    if (value.indexOf(",") > 0) {
      var tokens = value.split(",");
      if (tokens.length > altIdx) {
        annotValue = tokens[altIdx];
      } else {
        annotValue = value;
      }
    }  else {
      annotValue = value;
    }
    return annotValue;
  };

  exports.pileupVariants = function(variants, start, end, width) {
    var me = this;
    variants.forEach(function(v) {
      v.level = 0;
    });

    var featureWidth = 4;
    var posToPixelFactor = Math.round((end - start) / width);
    var widthFactor = featureWidth + 4;
    var maxLevel = me._pileupVcfRecordsImpl(variants, start, posToPixelFactor, widthFactor);
    if ( maxLevel > 30) {
      for(var i = 1; i < posToPixelFactor; i++) {
        // TODO:  Devise a more sensible approach to setting the min width.  We want the
        // widest width possible without increasing the levels beyond 30.
        if (i > 4) {
          featureWidth = 1;
        } else if (i > 3) {
          featureWidth = 2;
        } else if (i > 2) {
          featureWidth = 3;
        } else {
          featureWidth = 4;
        }

        variants.forEach(function(v) {
            v.level = 0;
        });
        var factor = posToPixelFactor / (i * 2);
        maxLevel = me._pileupVcfRecordsImpl(variants, start, factor, featureWidth + 1);
        if (maxLevel <= 50) {
          i = posToPixelFactor;
          break;
        }
      }
    }
    return { 'maxLevel': maxLevel, 'featureWidth': featureWidth };
  }

  exports._pileupVcfRecordsImpl = function(variants, regionStart, posToPixelFactor, 
    widthFactor) {
    
    widthFactor = widthFactor ? widthFactor : 1;
    // Variant's can overlap each over.  Set a field called variant.level which determines
    // how to stack the variants vertically in these cases.
    var posLevels = {};
    var maxLevel = 0;
    var posUnitsForEachVariant = posToPixelFactor * widthFactor;
    variants.forEach(function(variant) {

      // get next available vertical spot starting at level 0
      var startIdx = (variant.start - regionStart);// + i;
      var posLevel = 0;
      var stackAtStart = posLevels[startIdx];
      if (stackAtStart) {
        for (var k = 0; k <= stackAtStart.length; k++ ) {
          if (stackAtStart[k] == undefined) {
            posLevel = k;
            break;
          }
        }
      }

      // Set variant level.
      variant.level = posLevel;

      // Now set new level for each positions comprised of this variant.
      for (var i = 0; i < variant.len + posUnitsForEachVariant; i++) {
        var idx = (variant.start - regionStart) + i;
        var stack = posLevels[idx] || [];
        stack[variant.level] = true;
        posLevels[idx] = stack;

        // Capture the max level of the entire region.
        if (stack.length - 1 > maxLevel) {
          maxLevel = stack.length - 1;
        }
      }
    });
    return maxLevel;
  }


  exports.compareVcfRecords = function(variants1, variants2, comparisonAttr, onMatchFunction, onNoMatchFunction) {

    var set1Label = 'unique1';
    var set2Label = 'unique2';
    var commonLabel = 'common';
    var comparisonAttribute = comparisonAttr;
    if (comparisonAttribute == null) {
      comparisonAttribute = 'consensus';
    }

    variants1.count = variants1.features.length;
    variants2.count = variants2.features.length;

    var features1 = variants1.features;
    var features2 = variants2.features;

    // Flag duplicates as this will throw off comparisons
    var ignoreDups = function(features) {
      for (var i =0; i < features.length - 1; i++) {
        var variant = features[i];
        var nextVariant = features[i+1];
        if (i == 0) {
          variant.dup = false;
        }
        nextVariant.dup = false;

        if (variant.start == nextVariant.start) {
             var refAlt = variant.type.toLowerCase() + ' ' + variant.ref + "->" + variant.alt;
             var nextRefAlt = nextVariant.type.toLowerCase() + ' ' + nextVariant.ref + "->" + nextVariant.alt;

             if (refAlt == nextRefAlt) {
                nextVariant.dup = true;
             }
        }
      }
    }
    ignoreDups(features1);
    ignoreDups(features2);


    // Iterate through the variants from the first set,
    // marking the consensus field based on whether a
    // matching variant from the second list is encountered.
    var idx1 = 0;
    var idx2 = 0;
    while (idx1 < features1.length && idx2 < features2.length) {
      // Bypass duplicates
      if (features1[idx1].dup) {
        idx1++;
      }
      if (features2[idx2].dup) {
        idx2++;
      }

      variant1 = features1[idx1];
      variant2 = features2[idx2];

      var refAlt1 = variant1.type.toLowerCase() + ' ' + variant1.ref + "->" + variant1.alt;
      var refAlt2 = variant2.type.toLowerCase() + ' ' + variant2.ref + "->" + variant2.alt;

      if (variant1.start == variant2.start) {

        if (refAlt1 == refAlt2) {
          variant1[comparisonAttribute] =  commonLabel;
          variant2[comparisonAttribute] =  commonLabel;

          if (onMatchFunction) {
            onMatchFunction(variant1, variant2);
          }
          idx1++;
          idx2++;
        } else if (refAlt1 < refAlt2) {
          variant1[comparisonAttribute] = set1Label;
          if (onNoMatchFunction) {
            onNoMatchFunction(variant1, null);
          }
          idx1++;
        } else {
          variant2[comparisonAttribute] = set2Label;
          if (onNoMatchFunction) {
            onNoMatchFunction(null, variant2);
          }
          idx2++;
        }
      } else if (variant1.start < variant2.start) {
        variant1[comparisonAttribute] = set1Label;
        if (onNoMatchFunction) {
            onNoMatchFunction(variant1, null);
        }
        idx1++;
      } else if (variant2.start < variant1.start) {
        variant2[comparisonAttribute] = set2Label;
        if (onNoMatchFunction) {
            onNoMatchFunction(null, variant2);
        }
        idx2++;
      }

    }


    // If we get to the end of one set before the other,
    // mark the remaining as unique
    //
    if (idx1 < features1.length) {
      for(var x = idx1; x < features1.length; x++) {
        var variant1 = features1[x];
        variant1[comparisonAttribute] = set1Label;
        if (onNoMatchFunction) {
            onNoMatchFunction(variant1, null);
        }
      }
    }
    if (idx2 < features2.length) {
      for(var x = idx2; x < features2.length; x++) {
        var variant2 = features2[x];
        variant2[comparisonAttribute] = set2Label;
        if (onNoMatchFunction) {
            onNoMatchFunction(null, variant2);
        }
      }
    }



  };

  exports.processVcfFile = function(vcfFile, tbiFile, callback){

    let self = this;

    const proxyAddress = 'lf-proxy.iobio.io';
    const port = 443;
    const secure = true;
    const protocol = secure ? 'https:' : 'http:';
    // collected, which could lead to race conditions?
    createHoster({ proxyAddress, port, secure }).then((hoster) => {
      const vcfPath = '/' + vcfFile.name;
      hoster.hostFile({ path: vcfPath, file: vcfFile });
      const tbiPath = '/' + tbiFile.name;
      hoster.hostFile({ path: tbiPath, file: tbiFile });
      const portStr = hoster.getPortStr();
      const baseUrl = `${protocol}//${proxyAddress}${portStr}`;
      self.vcfURL = `${baseUrl}${hoster.getHostedPath(vcfPath)}`;
      self.tbiUrl = `${baseUrl}${hoster.getHostedPath(tbiPath)}`;
      self.sourceType = SOURCE_TYPE_URL;
      callback({vcf: self.vcfURL, tbi: self.tbiUrl })
    });

  };


  //
  //
  //
  //  PRIVATE
  //
  //
  //

  // Return this scope so that all subsequent calls
  // will be made on this scope.
  return exports;
};
