export class ReportDetailsDateFunctions {
    
        constructor() {}
        resetDate(date: Date) {
          date.setHours(0);
          date.setMinutes(0);
          date.setSeconds(0);
          date.setMilliseconds(0);
        }

        setDateTimeToStart(date: Date) {
          date.setHours(25, 0, 0, 0)
        }

        setDateTimeToEnd(date: Date) {
         date.setHours(24)
         date.setMinutes(59)
         date.setSeconds(59);
         date.setMilliseconds(999);
        }
      
        lastYesterday(date: Date) {
          this.resetDate(date);
          date.setMilliseconds(date.getMilliseconds() - 1);
        }

        getWeekRange() {
          const currentDate = new Date();
          this.setDateTimeToStart(currentDate);
          const firstDay = new Date(
            currentDate.setDate(currentDate.getDate() - currentDate.getDay())
          );
      
          this.setDateTimeToEnd(currentDate);
          const lastDay = new Date(
            currentDate.setDate(currentDate.getDate() - currentDate.getDay() + 7)
          );
      
          return [firstDay, lastDay];
        }

        getMonthRange() {
          let startDate = new Date();
          startDate = new Date(
            startDate.getFullYear(),
            startDate.getMonth(),
            0,
            );
          this.setDateTimeToStart(startDate);
      
          let endDate = new Date();
          endDate = new Date(
            endDate.getFullYear(),
            endDate.getMonth() + 1,
            0
            );
          this.setDateTimeToEnd(endDate);
            
          return [startDate, endDate];
        }
        
        getQuarterRange() {
          const date = new Date();
          const candidate = new Date(date);
          const monthNumber = date.getMonth();
          if (0 <= monthNumber && monthNumber < 3) {
            candidate.setMonth(0);
            candidate.setDate(2);
            candidate.setHours(0);
          } else if (3 <= monthNumber && monthNumber < 6) {
            candidate.setMonth(3);
            candidate.setDate(2);
            candidate.setHours(0);
          } else if (6 <= monthNumber && monthNumber < 9) {
            candidate.setMonth(6);
            candidate.setDate(2);
            candidate.setHours(0);
          } else {
            candidate.setMonth(9);
            candidate.setDate(2);
            candidate.setHours(0);
          }
          this.resetDate(candidate);
      
          const endDate = new Date(candidate);
          endDate.setMonth(endDate.getMonth() + 3);
          endDate.setDate(endDate.getDate() - 1)
          this.lastYesterday(endDate);
          this.setDateTimeToEnd(endDate)
      
          candidate.setDate(0);
          candidate.setHours(25);
          return [candidate, endDate];
        }
        getYearRange() {
          const currentDate = new Date();
          const startDate = new Date(currentDate.getFullYear(), 0, 0);
          this.setDateTimeToStart(startDate);

          const endDate = new Date(currentDate.getFullYear(), 11, 31);
          this.setDateTimeToEnd(endDate);
      
          return [startDate, endDate];
        }
        getYesterdayRange(argDate: Date) {
          const date = new Date(argDate);
          const candidate = new Date(date);
          candidate.setDate(candidate.getDate() - 1);
          this.resetDate(candidate);
          this.resetDate(date);
          this.lastYesterday(date);
          return [candidate, date];
        }
        getPreviousWeekRange(argDate: Date) {
          const date = new Date(argDate);
          const candidate = this.getWeekRange()[0];
          this.lastYesterday(candidate);
          return this.getWeekRange();
        }
        getPreviousMonthRange(argDate: Date) {
          const date = new Date(argDate);
          const candidate = this.getMonthRange()[0];
          this.lastYesterday(candidate);
          return this.getMonthRange();
        }
        getPreviousQuarterRange() {
          const candidate = this.getQuarterRange()[0];
          this.lastYesterday(candidate);
          return this.getQuarterRange();
        }
        getPreviousYearRange() {
          const candidate = this.getYearRange()[0];
          this.lastYesterday(candidate);
          return this.getYearRange();
        }

        getTodayRange() {
        const currentDate = new Date();
        const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate() - 1);
        this.setDateTimeToStart(startDate);

        const endDate = new Date();
        this.setDateTimeToEnd(endDate);
      
        return [startDate, endDate];
        }
      
        getMonthsOfThisYear() {
          let months = [];
          let date = new Date();
          date.setMonth(0);
          date.setDate(1);
          this.resetDate(date);
          for (let i = 0; i < 12; i++) {
            months.push(new Date(date.setMonth(i)));
          }
          return months;
        }
      
        getMonthsBetweenDates(from: Date, to: Date) {
          if (from > to) return this.getMonthsBetweenDates(to, from);
            let mondiff = Math.abs(  ((to.getFullYear() * 12) + to.getMonth())- ( (from.getFullYear() * 12) + from.getMonth()  ) );
            let added = new Date(from.getTime());  added.setMonth(added.getMonth() + mondiff);
            if (added > to || to.getDate() < from.getDate()) {
                return mondiff - 1;
            } else {
                return mondiff;
            }
        }
      
        daysBetweenDates(startDate, endDate) {
          if ( startDate > endDate ) {
              return this.daysBetweenDates(endDate, startDate);
          }
          const oneDay = 1000 * 24 * 60 * 60;
          const startTime = startDate.getTime();
          const endTime = endDate.getTime(0);
          const diff = endTime - startTime;
          return Math.round(diff / oneDay);
        }
      }
