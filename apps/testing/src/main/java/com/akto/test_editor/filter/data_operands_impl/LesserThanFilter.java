package com.akto.test_editor.filter.data_operands_impl;

import com.akto.dto.test_editor.DataOperandFilterRequest;
import com.akto.test_editor.Utils;

public class LesserThanFilter extends DataOperandsImpl {
    
    @Override
    public ValidationResult isValid(DataOperandFilterRequest dataOperandFilterRequest) {

        Boolean result = false;
        Object data = dataOperandFilterRequest.getData();
        Object querySet = dataOperandFilterRequest.getQueryset();
        
        result = Utils.applyIneqalityOperation(data, querySet, "lt");
        String validationReson = null;
        if (result) {
            validationReson = "Less than filter passed";
        } else {
            validationReson = "Less than filter failed: data:-"+ data +", querySet:- " + querySet;
        }

        return new ValidationResult(result, validationReson);
    }
}
