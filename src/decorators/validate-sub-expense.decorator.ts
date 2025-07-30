import {
    registerDecorator,
    ValidationOptions,
    ValidationArguments,
} from 'class-validator';
import { expenseTypeUnit } from 'src/modules/sfa/expense/models/expense.model';

export function ValidateSubExpense(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        let allErrors: string[] = [];
        
        registerDecorator({
            name: 'ValidateExpense',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(_value: any, args: ValidationArguments) {
                    const sub_expense: Record<string, any>[] = (args.object as any)[propertyName];
                    allErrors = [];
                    
                    if (!Array.isArray(sub_expense)) {
                        allErrors.push('sub_expense must be an array');
                        return false;
                    }
                    
                    const seenCombinations = new Set<string>();
                    
                    for (let i = 0; i < sub_expense.length; i++) {
                        const item = sub_expense[i];
                        const {
                            expense_type,
                            expense_type_unit,
                            expense_type_value,
                            expense_amount,
                            km,
                            expense_date,
                        } = item;
                        
                        const val = Number(expense_type_value);
                        const amt = Number(expense_amount);
                        
                        if (!expense_type || !expense_date) {
                            allErrors.push(`Item ${i + 1}: expense_type and expense_date are required`);
                            continue;
                        }
                        
                        const comboKey = `${expense_type}_${expense_date}`;
                        if (seenCombinations.has(comboKey)) {
                            allErrors.push(`Item ${i + 1} (${expense_type}, ${expense_date}): Duplicate combination of expense_type and expense_date`);
                        } else {
                            seenCombinations.add(comboKey);
                        }
                        
                        if (isNaN(val)) {
                            allErrors.push(`Item ${i + 1} (${expense_type}): expense_type_value must be a number`);
                        }
                        
                        if (isNaN(amt)) {
                            allErrors.push(`Item ${i + 1} (${expense_type}): expense_amount must be a number`);
                        }
                        
                        if (expense_type_unit === expenseTypeUnit.KM) {
                            const kmRate = Number(km);
                            if (isNaN(kmRate)) {
                                allErrors.push(`Item ${i + 1} (${expense_type}): km must be a number`);
                            } else {
                                const expectedAmount = val * kmRate;
                                if (amt !== expectedAmount) {
                                    allErrors.push(
                                        `Item ${i + 1} (${expense_type}): expense_amount (${amt}) must equal expense_type_value (${val}) * km (${kmRate}) = ${expectedAmount}`
                                    );
                                }
                            }
                        } else if (expense_type_unit === expenseTypeUnit.AMOUNT) {
                            if(val > 0){
                                if (amt > val) {
                                    allErrors.push(
                                        `Item ${i + 1} (${expense_type}): expense_amount (${amt}) cannot exceed expense_type_value (${val})`
                                    );
                                }
                            }
                        } else if (
                            expense_type_unit !== expenseTypeUnit.KM &&
                            expense_type_unit !== expenseTypeUnit.AMOUNT &&
                            expense_type_unit !== expenseTypeUnit.NULL
                        ) {
                            allErrors.push(`Item ${i + 1} (${expense_type}): Invalid expense_type_unit '${expense_type_unit}'`);
                        }
                    }
                    
                    return allErrors.length === 0;
                },
                
                defaultMessage() {
                    return allErrors.join('; ') || 'sub_expense validation failed';
                },
            },
        });
    };
}
