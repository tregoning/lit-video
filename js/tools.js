/**
 * This function creates a debounced instance of the provided function
 * @param fn - function to debounce
 * @param [time] - time to debounce in ms (defaults to 0)
 * @return {Function} - debounced function
 */
export const debounce = (fn, time) => {

    let timeoutID;

    return (...args) => {

        clearTimeout(timeoutID);

        timeoutID = setTimeout(() => {

            fn.apply(this, args);

        }, time);

    };

};