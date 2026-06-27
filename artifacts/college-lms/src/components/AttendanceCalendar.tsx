import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AttendanceItem {
  date: string;
  status: "present" | "absent" | "late";
}

interface Props {
  history: AttendanceItem[];
  onDateSelect?: (date: string) => void;
}

export default function AttendanceCalendar({
  history,
  onDateSelect,
}: Props) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const attendanceMap = useMemo(() => {
    const map = new Map<string, string>();

    history.forEach((item) => {
      const existing = map.get(item.date);

      if (!existing) {
        map.set(item.date, item.status);
      } else if (
        existing !== "absent" &&
        item.status === "absent"
      ) {
        map.set(item.date, "absent");
      } else if (
        existing === "present" &&
        item.status === "late"
      ) {
        map.set(item.date, "late");
      }
    });

    return map;
  }, [history]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDay = new Date(year, month, 1);

  const lastDay = new Date(year, month + 1, 0);

  const startDay = firstDay.getDay();

  const totalDays = lastDay.getDate();

  const cells = [];

  for (let i = 0; i < startDay; i++) {
    cells.push(null);
  }

  for (let i = 1; i <= totalDays; i++) {
    cells.push(new Date(year, month, i));
  }

  function format(date: Date) {
    return date.toISOString().split("T")[0];
  }

  return (
    <div className="rounded-xl border bg-card p-6">

      <div className="flex items-center justify-between mb-6">

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setCurrentMonth(
              new Date(year, month - 1, 1)
            )
          }
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <h2 className="font-bold text-xl">
          {currentMonth.toLocaleString("default", {
            month: "long",
            year: "numeric",
          })}
        </h2>

        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setCurrentMonth(
              new Date(year, month + 1, 1)
            )
          }
        >
          <ChevronRight className="h-4 w-4" />
        </Button>

      </div>

      <div className="grid grid-cols-7 gap-2 text-center font-semibold text-sm mb-2">

        {["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=>(
          <div key={day}>
            {day}
          </div>
        ))}

      </div>

      <div className="grid grid-cols-7 gap-2">

        {cells.map((date,index)=>{

          if(!date){

            return (
              <div
                key={index}
                className="h-12"
              />
            );
          }

          const key=format(date);

          const status=attendanceMap.get(key);

          return(

            <button
              key={key}
              onClick={()=>onDateSelect?.(key)}
              className="relative h-12 rounded-lg border hover:bg-muted transition"
            >

              {date.getDate()}

              {status &&(

                <div
                  className={`absolute bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full

                  ${
                    status==="present"

                    ?"bg-green-500"

                    :status==="late"

                    ?"bg-yellow-500"

                    :"bg-red-500"
                  }

                  `}
                />

              )}

            </button>

          );

        })}

      </div>

      <div className="flex gap-6 mt-6 text-sm">

        <div className="flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-green-500"/>

          Present

        </div>

        <div className="flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-red-500"/>

          Absent

        </div>

        <div className="flex items-center gap-2">

          <div className="w-3 h-3 rounded-full bg-yellow-500"/>

          Late

        </div>

      </div>

    </div>
  );
}