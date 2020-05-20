var _ = require('lodash');
var RefParser = require('json-schema-ref-parser');

var info = require('./info.js');
var responses = require('./responses.js');
var definitions = require('./definitions.js');
var paths = require('./paths.js');

module.exports = {
  printSlateMarkdown: function(api, program) {
    RefParser.dereference(api)
      .then(function(deRefApi) {
        // Paths from dereferenced API
        var epPaths = paths.addEndpointToPaths(deRefApi.basePath, deRefApi.paths);
        if(!program.includeInternal) {
          epPaths = paths.filterInternalTag(epPaths);
        }

        if (program.pathsOnly) {
          let output = printPathsOnly(epPaths);
          if (program.readme) {
            replaceBlock(program.readme, output, `Available paths:\n\`\`\``, )
          } else {
            console.log(output)
          }
        } else 
          printNormal(epPaths, api, program.includeInternal);
      })
      .catch(function(err) {
        console.error('API dereference failed: ' + err);
      });
  }
};

const methods=['get','post', 'put','delete','options', 'head']
const printPathsOnly = (epPaths) => {
  const util = require('util')
  let parameters ="Available paths:\n```\n"
  epPaths = epPaths.sort( (a,b) => (a.endpoint > b.endpoint)? 1 : -1 )
  epPaths.forEach(path => {
    
    methods.forEach( method =>{
      if (!path.hasOwnProperty(method))
        return
      let type = method.toUpperCase().padEnd(10,' ')
      let paramList = path[method].parameters.filter(el => el.in === 'query' && el.required==true).map(el=>`${el.name}=[${el.name}]`).join('&')
      parameters += util.format(`${type} ${path['endpoint']}?${paramList}\n`)
    })
  });
  parameters+='\n```\n'
  return parameters
}

const printNormal= (epPaths, api, includeInternal)=> {
  var groupedEpPaths = paths.groupPathsByTag(epPaths);
   // Info Section
  console.log(info.headerWithInfo(api, false));
  console.log(paths.sectionIndexOfGroupedEndpointPaths(groupedEpPaths, includeInternal));
  console.log(paths.sectionForGroupedEndpointPaths(groupedEpPaths, includeInternal));
  // Responses + Definitions
  console.log(responses.responsesSection(api.responses, 1));
  console.log(definitions.definitionsObject(api.definitions));
}

const replaceBlock = (file, output, start_block, end) => {
  var fs = require('fs')
  fs.readFile(file, 'utf8', function (err,data) {
  if (err) {
    return console.log(err);
  }
  const regex = new RegExp(`${start_block}.*?\`\`\``,"s"); //```.*```/g, output);)
  var result = data.replace(regex, output)

  fs.writeFile(file, result, 'utf8', function (err) {
     if (err) return console.log(err);
  });
});
}