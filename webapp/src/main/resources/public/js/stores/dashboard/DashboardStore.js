import alt from "../../alt";
import DashboardDataSource from "../../actions/dashboard/DashboardDataSource";
import DashboardSearchParamStore from "./DashboardSearchParamStore";
import DashboardPageActions from "../../actions/dashboard/DashboardPageActions";
import BranchStatisticsContent from "../../sdk/entity/BranchStatisticsContent";

class DashboardStore {
    constructor() {
        /**
         *
         * @type {branchStatistics[]}
         */
        this.setDefaultState();

        this.bindActions(DashboardPageActions);
        this.registerAsync(DashboardDataSource);
    }

    setDefaultState() {
        this.hasNext= false;
        this.hasPrevious= false;
        this.size = 10;
        this.currentPageNumber = 0;
        this.first = true;
        this.numberOfElements = 0;
        this.totalPages = 1;
        this.totalElements = 0;
        this.last = true;
        this.branchStatistics = [];
        this.searching = false;
        this.screenshotUploaded = {};
        this.textUnitChecked = [];
        this.isBranchOpen = [];
        this.openBranchIndex = -1;
        this.numberOfTextUnitChecked = 0;
        this.totalTextUnitsInPage = 0;
    }

    getBranches() {
        this.waitFor(DashboardSearchParamStore);
        this.getInstance().performDashboardSearch();
        this.isSearching = true;
    }

    getBranchesSuccess(branchStatistics) {
        this.hasNext = branchStatistics.hasNext;
        this.hasPrevious = branchStatistics.hasPrevious;
        this.currentPageNumber = branchStatistics.number;
        this.first = branchStatistics.first;
        this.numberOfElements = branchStatistics.numberOfElements;
        this.totalPages = branchStatistics.totalPages;
        this.totalElements = branchStatistics.totalElements;
        this.last = branchStatistics.last;
        this.branchStatistics = BranchStatisticsContent.toContentList(branchStatistics.content);
        this.isSearching = false;
        this.isBranchOpen = Array.apply(null, Array(branchStatistics.length)).map(function () {
            return false;
        });

        if (this.isBranchOpen.length > 0){
            this.isBranchOpen[0] = true; // TODO(ja) review, select the first branch
            this.openBranchIndex = 0;
        }


        this.totalTextUnitsInPage = 0;
        for (let i = 0; i < this.branchStatistics.length; i++) {
            //TODO: update screenshot data
            this.textUnitChecked.push(Array.apply(null, Array(this.branchStatistics[i].branchTextUnitStatistics.length)).map(function () {
                return false
            }));
            this.totalTextUnitsInPage += this.branchStatistics[i].branchTextUnitStatistics.length;
            this.branchStatistics[i].branchTextUnitStatistics.forEach(e => this.screenshotUploaded[e.tmTextUnit.id] = e.tmTextUnit);
        }

        for (let i = 0; i < this.branchStatistics.length; i++) {
            for (let j = 0; j < this.branchStatistics[i].branch.screenshots.length; j++) {
                for (let k = 0; k < this.branchStatistics[i].branch.screenshots[j].textUnits.length; k++) {
                    this.screenshotUploaded[this.branchStatistics[i]
                                                .branch
                                                .screenshots[j]
                                                .textUnits[k]
                                                .tmTextUnit
                                                .id
                                            ].screenshotUploaded = true;
                }
            }
        }

    }

    onBranchCollapseChange(index) {
        this.resetAllSelectedTextUnitsInCurrentPage();
        let isOpen =  !this.isBranchOpen[index];
        this.isBranchOpen.fill(false);
        this.isBranchOpen[index] = isOpen;
        if(isOpen) {
            this.openBranchIndex = index;
        }
    }

    textUnitCheckboxChanged(index) {
        this.textUnitChecked[index.index0][index.index1] = !this.textUnitChecked[index.index0][index.index1];
        this.numberOfTextUnitChecked +=  this.textUnitChecked[index.index0][index.index1] ? 1 : -1;
    }

    selectAllTextUnitsInCurrentPage() {
        this.textUnitChecked.forEach(e => e.fill(true));
        this.numberOfTextUnitChecked = this.totalTextUnitsInPage;
    }

    resetAllSelectedTextUnitsInCurrentPage() {
        this.textUnitChecked.forEach(e => e.fill(false));
        this.numberOfTextUnitChecked = 0;
    }

    fetchPreviousPage() {
        if(this.currentPageNumber > 0) {
            currentPageNumber--;
            this.getBranches();
        }
    }

    fetchNextPage() {
        if(this.currentPageNumber < this.totalPages) {
            currentPageNumber++;
            this.getBranches();
        }
    }
}

export default alt.createStore(DashboardStore, "DashboardStore")