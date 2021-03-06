var ngSelectionProvider = function (grid, $scope, $parse, $utils) {
    var self = this;
    self.multi = grid.config.multiSelect;
    self.selectedItems = grid.config.selectedItems;
    self.selectedIndex = grid.config.selectedIndex;
    self.lastClickedRow = undefined;
    self.ignoreSelectedItemChanges = false; // flag to prevent circular event loops keeping single-select var in sync
    var pKeyExpression = grid.config.primaryKey;
    if (pKeyExpression) {
      pKeyExpression = $utils.preEval('entity.' + grid.config.primaryKey);
    }
    self.pKeyParser = $parse(pKeyExpression);

  // function to manage the selection action of a data item (entity)
    self.ChangeSelection = function (rowItem, evt) {
        // ctrl-click + shift-click multi-selections
        // up/down key navigation in multi-selections
        var charCode = evt.which || evt.keyCode;
        var isUpDownKeyPress = (charCode === 40 || charCode === 38);

        if (evt && evt.shiftKey && !evt.keyCode && self.multi && grid.config.enableRowSelection) {
            if (self.lastClickedRow) {
                var rowsArr;
                if ($scope.configGroups.length > 0) {
                    rowsArr = grid.rowFactory.parsedData.filter(function(row) {
                        return !row.isAggRow;
                    });
                }
                else {
                    rowsArr = grid.filteredRows;
                }

                var thisIndx = rowItem.rowIndex;
                var prevIndx = self.lastClickedRowIndex;
                
                if (thisIndx === prevIndx) {
                    return false;
                }

                if (thisIndx < prevIndx) {
                    thisIndx = thisIndx ^ prevIndx;
                    prevIndx = thisIndx ^ prevIndx;
                    thisIndx = thisIndx ^ prevIndx;
                    thisIndx--;
                }
                else {
                    prevIndx++;
                }

                var rows = [];
                for (; prevIndx <= thisIndx; prevIndx++) {
                    rows.push(rowsArr[prevIndx]);
                }

                if (rows[rows.length - 1].beforeSelectionChange(rows, evt)) {
                    for (var i = 0; i < rows.length; i++) {
                        var ri = rows[i];
                        var selectionState = ri.selected;
                        ri.selected = !selectionState;
                        if (ri.clone) {
                            ri.clone.selected = ri.selected;
                        }
                        var index = self.selectedItems.indexOf(ri.entity);
                        if (index === -1) {
                            self.selectedItems.push(ri.entity);
                        }
                        else {
                            self.selectedItems.splice(index, 1);
                        }
                    }
                    rows[rows.length - 1].afterSelectionChange(rows, evt);
                }
                self.lastClickedRow = rowItem;
                self.lastClickedRowIndex = rowItem.rowIndex;

                return true;
            }
        }
        else if (!self.multi) {
            if (self.lastClickedRow === rowItem) {
                self.setSelection(self.lastClickedRow, grid.config.keepLastSelected ? true : !rowItem.selected);
            } else {
                if (self.lastClickedRow) {
                    self.setSelection(self.lastClickedRow, false);
                }
                self.setSelection(rowItem, !rowItem.selected);
            }
        }
        else if (!evt.keyCode || isUpDownKeyPress && !grid.config.selectWithCheckboxOnly) {
            self.setSelection(rowItem, !rowItem.selected);
        }
        self.lastClickedRow = rowItem;
        self.lastClickedRowIndex = rowItem.rowIndex;
        return true;
    };

    self.getSelection = function (entity) {
        return self.getSelectionIndex(entity) !== -1;
    };

    self.getSelectionIndex = function (entity) {
        var index = -1;
        if (grid.config.primaryKey) {
            var val = self.pKeyParser({entity: entity});
            angular.forEach(self.selectedItems, function (c, k) {
                if (val === self.pKeyParser({entity: c})) {
                    index = k;
                }
            });
        }
        else {
            index = self.selectedItems.indexOf(entity);
        }
        return index;
    };

    // just call this func and hand it the rowItem you want to select (or de-select)    
    self.setSelection = function (rowItem, isSelected) {
        if(grid.config.enableRowSelection){
            if (!isSelected) {
                var indx = self.getSelectionIndex(rowItem.entity);
                if (indx !== -1) {
                    self.selectedItems.splice(indx, 1);
                }
            }
            else {
                if (self.getSelectionIndex(rowItem.entity) === -1) {
                    if (!self.multi && self.selectedItems.length > 0) {
                        self.toggleSelectAll(false, true);
                    }
                    self.selectedItems.push(rowItem.entity);
                }
            }
            rowItem.selected = isSelected;
            if (rowItem.orig) {
                rowItem.orig.selected = isSelected;
            }
            if (rowItem.clone) {
                rowItem.clone.selected = isSelected;
            }
            rowItem.afterSelectionChange(rowItem);
        }
    };

    // @return - boolean indicating if all items are selected or not
    // @val - boolean indicating whether to select all/de-select all
    self.toggleSelectAll = function (checkAll, bypass, selectFiltered) {
        var rows = selectFiltered ? grid.filteredRows : grid.rowCache, wasSelected, index;
        if (bypass || grid.config.beforeSelectionChange(rows, checkAll)) {
            if (!selectFiltered && self.selectedItems.length > 0) {
                self.selectedItems.length = 0;
            }
            for (var i = 0; i < rows.length; i++) {
                wasSelected = rows[i].selected;
                rows[i].selected = checkAll;
                if (rows[i].clone) {
                    rows[i].clone.selected = checkAll;
                }
                if (!wasSelected && checkAll) {
                    self.selectedItems.push(rows[i].entity);
                } else if (wasSelected && !checkAll) {
                    index = self.getSelectionIndex(rows[i].entity);
                    if (index > -1) {
                        self.selectedItems.splice(index, 1);
                    }
                }
            }
            if (!bypass) {
                grid.config.afterSelectionChange(rows, checkAll);
            }
        }
    };
};
