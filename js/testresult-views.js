/**
 * assuming results an array of json objects ;
 * {
    noOfAll: "0"
    noOfPass: "0"
    technique: "ARIA6"
    techniqueTitle: "Using aria-label to provide labels for objects"
 * }
 *
 */

testcaseData = {
  "entity": [
    {
      "noOfAll": "2",
      "noOfPass": "1",
      "testcaseId": "H49_0000073",
      "testcaseTitle": "Em and strong elements can be used to stress parts of a text"
    },
    {
      "noOfAll": "3",
      "noOfPass": "1",
      "testcaseId": "H49_0000074",
      "testcaseTitle": "sub elements indicate subscript in HTML"
    },
    {
      "noOfAll": "4",
      "noOfPass": "1",
      "testcaseId": "H49_0000075",
      "testcaseTitle": "sup elements indicate superscript in HTML"
    },
    {
      "noOfAll": "5",
      "noOfPass": "2",
      "testcaseId": "H49_0000076",
      "testcaseTitle": "abbr and acronym can identify special text in html"
    },
    {
      "noOfAll": "6",
      "noOfPass": "3",
      "testcaseId": "H49_0000077",
      "testcaseTitle": "b, i and u can identify special text in HTML"
    },
    {
      "noOfAll": "7",
      "noOfPass": "5",
      "testcaseId": "H49_0000078",
      "testcaseTitle": "small identifies special text in HTML"
    }
  ]
};

accessdb.Views.TestResultsDataOverview = function (){
    this.$el = $("#TestResultsDataOverviewDiv");
    this.results = null;
    this.render = function(){
        if(this.results){
            var template = _.template( $("#TestResultsDataOverview_template").html(), {results: this.results} );
            this.$el.html( template );
            this.$el.find('button').on('click', function(){
              el = $(this);
              eltbody = el.parents('tbody');
              sistertbody = eltbody.next(); // tbody.testcases
              icon = el.find('.icon');
              iconlabel = icon.find('.visuallyhidden');
              eltbody.toggleClass('collapsed');
              console.log(testcaseData);
              var tctemplate = _.template( $("#TestResultsDataOverviewTestCases_template").html(), {results: testcaseData} );
              sistertbody.html( tctemplate );
              icon.toggleClass('icon-collapse icon-expand');
              if (icon.is('.icon-expand')) {
                iconlabel.text('Expand');
              } else {
                iconlabel.text('Collapse');
              }
            });

        }
    };
    this.fetch = function (filter, callback){
        var self = this;
        if (!filter){
            console.warn("No filter defined!");
            callback("No filter defined!", null);
        }
        else {
            accessdb.API.TESTRESULT.getDataOverview(filter, function (error, data, status) {
                if(!error){
                    console.log(data);
                    self.results = data;
                    callback(null, self.results);
                }
                callback(error);
            }, self.$el);
        }
    };
    this.reload = function(){
        var pageId = accessdb.config.PAGE_ID_PREFIX+"results";
        if(accessdb.appRouter.page === pageId){
            var self = this;
            this.fetch( accessdb.filters[pageId], function(error, data){
                if(!error)
                    self.render();
            });
        }
    }
};
