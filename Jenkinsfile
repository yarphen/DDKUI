properties([pipelineTriggers([githubPush()])])

pipeline {
  environment {
    REGISTRY = credentials("registry-cred-dockerhub")
    TAG = ""
  }
  agent any
  stages {
    stage("Getting tag") {
      steps{
        script {
          TAG = sh(returnStdout: true, script: "cd $WORKSPACE && git tag -l --points-at HEAD | tail -1").trim()
        }
      }
    }
    stage("Building") {
      steps{
        script {
          if (TAG) {
            sh("echo 'Building current tag: $TAG'")
            sh("cd $WORKSPACE && docker build -t ddkoin/ui:$TAG .")
          } else {
            sh("echo 'Nothing to build: no tag'")
          }
        }
      }
    }
    stage("Pushing") {
      steps{
        script {
          if (TAG) {
            sh("echo 'Pushing current tag: $TAG'")
            sh("echo $REGISTRY_PSW | docker login --password-stdin --username $REGISTRY_USR")
            sh("docker push ddkoin/ui:$TAG")
          } else {
            sh("echo 'Nothing to build: no tag'")
          }
        }
      }
    }
  }
}