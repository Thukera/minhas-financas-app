// PROGRESS BAR COLORS
export const getProgressStyle = (limiteUtilizado: number, sliderMax: number) => {
    const percent = (limiteUtilizado / sliderMax) * 100;

    if (percent < 20) return "#057a49ff";
    else if (percent < 40) return "#00B96B";
    else if (percent < 60) return "#FFD43B";
    else if (percent < 80) return "#FF8C42";
    else if (percent < 100) return "#FF3838";
    else return "#9b0909ff";
};

// DATE FORMATTING
export const formatDate = (date: Date) => date.toLocaleDateString("pt-BR");

// SALARY PERIOD CALC
export const getSalaryPeriod = (today: Date, salaryDay: number) => {
    let beginDate: Date;
    let endDate: Date;

    if (today.getDate() < salaryDay) {
        beginDate = new Date(today.getFullYear(), today.getMonth() - 1, salaryDay);
        endDate = new Date(today.getFullYear(), today.getMonth(), salaryDay);
    } else {
        beginDate = new Date(today.getFullYear(), today.getMonth(), salaryDay);
        endDate = new Date(today.getFullYear(), today.getMonth() + 1, salaryDay);
    }

    return { beginDate, endDate };
};
