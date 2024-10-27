package main

import (
    "encoding/json"
    "log"
    "net/http"
    "os"
    "strconv"
    "time"

    "github.com/xuri/excelize/v2"
    "github.com/joho/godotenv"
)

type Result struct {
    PhoneNumber string   `json:"phone_number"`
    Numbers     []string `json:"numbers"`
}



func main() {
    err := godotenv.Load()
    if err != nil {
        log.Fatal("Error loading .env file")
    }

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }

    fs := http.FileServer(http.Dir("./static"))
    http.Handle("/", fs)
    http.HandleFunc("/api/result", handleResult)
    http.HandleFunc("/accounting", serveAccountingPage)
    http.HandleFunc("/api/download", handleDownload)

    log.Printf("Starting server on port %s...\n", port)
    err = http.ListenAndServe(":"+port, nil)
    if err != nil {
        log.Fatal(err)
    }
}

func handleResult(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
        return
    }

    var result Result
    err := json.NewDecoder(r.Body).Decode(&result)
    if err != nil {
        http.Error(w, "Invalid JSON", http.StatusBadRequest)
        return
    }

    f, err := excelize.OpenFile("Отчетность.xlsx")
    if err != nil {
        log.Println("Cannot open file:", err)
        http.Error(w, "Cannot open file", http.StatusInternalServerError)
        return
    }

    rows, err := f.GetRows("Лист1")
    if err != nil {
        log.Println("Cannot get rows:", err)
        http.Error(w, "Cannot get rows", http.StatusInternalServerError)
        return
    }
    nextRow := len(rows) + 1 

    f.SetCellValue("Лист1", "A"+strconv.Itoa(nextRow), result.PhoneNumber)
    for i, number := range result.Numbers {
        if i < 5 { 
            col := string('B' + rune(i)) 
            f.SetCellValue("Лист1", col+strconv.Itoa(nextRow), number)
        }
    }

    currentDate := time.Now().Format("2006-01-02") 
    f.SetCellValue("Лист1", "G"+strconv.Itoa(nextRow), currentDate)

    style, err := f.NewStyle(&excelize.Style{
        Border: []excelize.Border{
            {
                Type:  "left",
                Color: "000000",
                Style: 1,
            },
            {
                Type:  "top",
                Color: "000000",
                Style: 1, 
            },
            {
                Type:  "right",
                Color: "000000",
                Style: 1, 
            },
            {
                Type:  "bottom",
                Color: "000000",
                Style: 1, 
            },
        },
    })
    if err != nil {
        log.Println("Failed to create style:", err)
        http.Error(w, "Failed to create style", http.StatusInternalServerError)
        return
    }

    f.SetCellStyle("Лист1", "A"+strconv.Itoa(nextRow), "G"+strconv.Itoa(nextRow), style)

    if err := f.Save(); err != nil {
        log.Println("Failed to save file:", err)
        http.Error(w, "Failed to save file", http.StatusInternalServerError)
        return
    }

    w.WriteHeader(http.StatusOK)
    w.Write([]byte("Data written successfully"))
}

func serveAccountingPage(w http.ResponseWriter, r *http.Request) {
    http.ServeFile(w, r, "./static/accounting.html")
}

func handleDownload(w http.ResponseWriter, r *http.Request) {
    if r.Method != http.MethodPost {
        http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
        return
    }

    err := r.ParseMultipartForm(10 << 20) 
    if err != nil {
        http.Error(w, "Unable to parse form", http.StatusBadRequest)
        return
    }

    password := r.FormValue("password")

    validPassword := os.Getenv("ACCOUNTING_PASSWORD")

    if password != validPassword {
        http.Error(w, "Invalid password", http.StatusUnauthorized)
        return
    }

    filePath := "Отчетность.xlsx"
    w.Header().Set("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    w.Header().Set("Content-Disposition", "attachment; filename=\"Отчетность.xlsx\"")
    http.ServeFile(w, r, filePath)
}