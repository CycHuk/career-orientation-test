const container = document.querySelector(".container");

let currentQuestionIndex = 0;
let columnSums = [0, 0, 0, 0, 0];
let columnMaxValues = [0, 0, 0, 0, 0];

jQuery(function ($) {
  $("#tel").mask("+7 (999) 999-99-99");

  $(window).on("beforeunload", function () {
    $("#tel").val("");
  });

  function navigateToTest(withFeedback) {
    const phoneNumber = $("#tel").val();

    if (withFeedback && !phoneNumber) {
      toastr.options = {
        positionClass: "toast-top-center",
        timeOut: "1000",
        preventDuplicates: true,
      };
      toastr.error("Не введен номер телефона!", "Ошибка");
    } else {
      if (!withFeedback) {
        $("#tel").val("");
      }

      currentQuestionIndex = 0;
      columnSums = [0, 0, 0, 0, 0];
      columnMaxValues = [0, 0, 0, 0, 0];

      loadQuestions();

      document.getElementById("question_container").textContent = "";

      $("#page_preview").removeClass("active");
      $("#page_test").addClass("active");
      container.style.maxWidth = "500px";

      const yesButton = document.getElementById("yes_button");
      yesButton.style.display = "none";

      const noButton = document.getElementById("no_button");
      noButton.style.display = "none";
    }
  }

  $("#feedbackButton").click(function () {
    navigateToTest(true);
  });

  $("#noFeedbackButton").click(function () {
    navigateToTest(false);
  });
});

function loadQuestions() {
  columnMaxValues = new Array(5).fill(0);
  for (const question of questions) {
    for (let i = 0; i < columnMaxValues.length; i++) {
      columnMaxValues[i] += question.values[i] || 0;
    }
  }

  document.getElementById("info_container").style.display = "block";
}

function displayQuestion() {
  const questionContainer = document.getElementById("question_container");
  const totalQuestions = questions.length;

  if (currentQuestionIndex < totalQuestions) {
    const questionText = questions[currentQuestionIndex].question;
    questionContainer.textContent = `${currentQuestionIndex + 1}/${totalQuestions}: ${questionText}`;
  } else {
    displayResults();
  }
}

function displayResults() {
  $("#page_test").removeClass("active");
  $("#page_result").addClass("active");

  container.style.maxWidth = "900px";

  let columnsData = columnSums.map((sum, index) => ({
    sum: sum,
    max: columnMaxValues[index],
    percentage: (sum / columnMaxValues[index]) * 100,
    id: `column_${index + 1}`,
    barId: `bar${String.fromCharCode(65 + index)}`,
    percentageId: `percentage${String.fromCharCode(65 + index)}`,
  }));

  columnsData.sort((a, b) => b.percentage - a.percentage);

  const columnsContainer = document.getElementById("columns");
  columnsData.forEach((column) => {
    let barColor;
    if (column.percentage < 30) {
      barColor = "#f44336";
    } else if (column.percentage < 60) {
      barColor = "#ff9800";
    } else if (column.percentage < 80) {
      barColor = "#ffeb3b";
    } else {
      barColor = "#4caf50";
    }

    const bar = document.getElementById(column.barId);
    bar.style.width = column.percentage + "%";
    bar.style.backgroundColor = barColor;

    const percentageText = document.getElementById(column.percentageId);
    percentageText.textContent = `${column.percentage.toFixed(0)}%`;

    const columnElement = document.getElementById(column.id);
    columnsContainer.appendChild(columnElement);
  });

  const data = {
    phone_number: document.getElementById("tel").value || "без номера",
    numbers: [
      document.getElementById("percentageA").textContent,
      document.getElementById("percentageB").textContent,
      document.getElementById("percentageC").textContent,
      document.getElementById("percentageD").textContent,
      document.getElementById("percentageE").textContent,
    ],
  };

  fetch("/api/result", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok: " + response.statusText);
      }
      return response.text();
    })
    .then((data) => {
      console.log("Success:", data);
    })
    .catch((error) => {
      console.error("Error:", error);
    });
}

document.getElementById("yes_button").addEventListener("click", () => {
  // console.log(`Вопрос: ${questions[currentQuestionIndex].question}, Ответ: Да`);
  const values = questions[currentQuestionIndex].values;
  for (let i = 0; i < columnSums.length; i++) {
    columnSums[i] += values[i];
  }
  currentQuestionIndex++;
  displayQuestion();
});

document.getElementById("no_button").addEventListener("click", () => {
  // console.log(
  //   `Вопрос: ${questions[currentQuestionIndex].question}, Ответ: Нет`
  // );
  currentQuestionIndex++;
  displayQuestion();
});

document.getElementById("start_button").addEventListener("click", () => {
  document.getElementById("info_container").style.display = "none";
  document.getElementById("question_container").style.display = "block";
  document.getElementById("yes_button").style.display = "inline-block";
  document.getElementById("no_button").style.display = "inline-block";
  displayQuestion();
});

function toggleInfo(infoId) {
  const infoDiv = document.getElementById(infoId);
  if (infoDiv.style.display === "none") {
    infoDiv.style.display = "block";
  } else {
    infoDiv.style.display = "none";
  }
}

function retryTest() {
  container.style.maxWidth = "400px";
  $("#tel").val("");

  $("#page_result").removeClass("active");
  $("#page_preview").addClass("active");
}

function toggleDropdown(dropdownId) {
  const dropdown = document.getElementById(dropdownId);

  dropdown.classList.toggle("show");
}
