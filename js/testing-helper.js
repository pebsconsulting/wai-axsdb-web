accessdb.Models.TestingHelper = function (){
    var testIds = null;
    var holder = "#testingForm";
    var test, testResult, userProfile = null;
    var count = 0;
    return {
        start: function () {
            count = 0;
            this.loadDataFromSession();
            userProfile = UserTestingProfile.getUserProfileById(accessdb.session.get("testProfileId"));
            console.log("TestingHelper started with " + testIds.length + " tests, profile id " + userProfile.id + " and count " + count);
        },
        loadDataFromSession: function () {
            testIds = _.clone(accessdb.session.get("testUnitIdList"));
            testIds.sort();
        },
        loadNext: function () {
            if(userProfile===null){
                console.error("TestingRunner has not been started");
                return false;
            }
            if(this.hasNext()){
                this.prepareTestData();
                test.showInTestingPage();
                this.progressUpdate();
                count ++;
                return true;
            }
            return false;
        },
        saveAndLoadNext : function(){
            this.prepareResult();
            this.saveDataToSession();
            Utils.resetForm(holder);
            return this.loadNext();
        },
        saveDataToSession: function (){
            testIds = _.filter(testIds, function(item) {
                return item !== test.testUnitId;
            });
            accessdb.session.set("testUnitIdList", _.clone(testIds));
            var testResultList = accessdb.session.get("testResultList");
            testResultList = _.filter(testResultList, function(item) {
                return item.testUnitId !== test.testUnitId;
            });
            testResultList.push(testResult);
            accessdb.session.set("testResultList", _.clone(testResultList));
            testResult = null;
            test = null;
        },
        prepareTestData: function () {
            var nextId = _.clone(testIds).shift();
            test = new TestUnit();
            test.loadByIdSync(nextId);
        },
        prepareResult: function () {
            testResult = new TestResult();
            testResult.comment = $("#cmnt").val();
            testResult.resultValue = $("input[name='result']:checked").val();
            testResult.testUnitDescription =
            {
                id: test.id
            };
            testResult.testUnitId = test.testUnitId;
            testResult.testingProfile = new TestingProfile();
            testResult.testingProfile.setDataWithNoId(userProfile.profile);
            testResult.type = "RESULT";
            var nowD = new Date();
            testResult.runDate = nowD.toJSON();
        },
        hasNext: function () {
            return testIds.length > 0;
        },
        countMore: function(){
            return testIds.length;
        },
        countDone: function(){
            return count;
        },
        progressUpdate : function (){
            var current = count + 1;
            var all = this.countMore() + count;
            $("#axsdb-page-test-run progress").attr("max", all);
            $("#axsdb-page-test-run progress").attr("value", current);
            $("#axsdb-page-test-run progress").html(current + " of " + all + " Tests finished");
        }
    }
}