import java.util.Properties

plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

val keystoreProps = Properties()
val keystoreFile = rootProject.file("keystore.properties")
if (keystoreFile.exists()) {
    keystoreFile.inputStream().use { keystoreProps.load(it) }
}

android {
    namespace = "top.airgzn.rnews"
    compileSdk = 34

    defaultConfig {
        applicationId = "top.airgzn.rnews"
        minSdk = 24
        targetSdk = 34
        versionCode = 1
        versionName = "1.0"
    }

    signingConfigs {
        create("release") {
            storeFile = rootProject.file(keystoreProps.getProperty("storeFile", "rnews.keystore"))
            storePassword = keystoreProps.getProperty("storePassword", "rnews-app")
            keyAlias = keystoreProps.getProperty("keyAlias", "rnews")
            keyPassword = keystoreProps.getProperty("keyPassword", "rnews-app")
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            signingConfig = signingConfigs.getByName("release")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("androidx.webkit:webkit:1.11.0")
}

tasks.register<Copy>("syncWebAssets") {
    from(rootProject.file("../mobile"))
    into(layout.projectDirectory.dir("src/main/assets/www"))
    include("index.html", "app.js", "styles.css")
}

tasks.named("preBuild") {
    dependsOn("syncWebAssets")
}
