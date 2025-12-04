async function generateAchievementsTable() {
  try {
    const response = await fetch('../data/achievements.json');
    const achievements = await response.json();

    const tbody = document.querySelector('.achievements-table tbody');
    if (!tbody) {
      return;
    }

    tbody.innerHTML = '';

    achievements.forEach((item, index) => {
      const row = document.createElement('tr');
      
      const yearCell = document.createElement('td');
      const monthDayCell = document.createElement('td');
      const contentCell = document.createElement('td');
      const link = document.createElement('a');
      link.href = item.url;
      link.textContent = item.content + ' >';
      contentCell.appendChild(link);

      if (index > 0 && achievements[index - 1].year === item.year) {
        yearCell.textContent = '';
      } else {
        yearCell.textContent = item.year + '年';
      }

      if (index > 0 && achievements[index - 1].month === item.month && achievements[index - 1].day === item.day) {
        monthDayCell.textContent = '';
      } else {
        monthDayCell.textContent = item.month + '月' + item.day + '日';
      }

      if (index < achievements.length - 1) {
        const nextItem = achievements[index + 1];
        
        if (item.year === nextItem.year) {
          yearCell.classList.add('no-border-bottom');
        }
        
        if (item.month === nextItem.month && item.day === nextItem.day) {
          monthDayCell.classList.add('no-border-bottom');
        }
      }

      row.appendChild(yearCell);
      row.appendChild(monthDayCell);
      row.appendChild(contentCell);
      tbody.appendChild(row);
    });
  } catch (error) {
  }
}

document.addEventListener('DOMContentLoaded', generateAchievementsTable);
